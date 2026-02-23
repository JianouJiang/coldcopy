import { generateId } from '../../../lib/auth';
import { exchangeCode } from '../../../lib/gmail';
import { encryptToken } from '../../../lib/crypto';

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const userId = url.searchParams.get('state');
  const googleError = url.searchParams.get('error');

  // Google returns error param if user denied access or isn't a test user
  if (googleError) {
    const reason = googleError === 'access_denied'
      ? 'Access denied. If you see "This app is not verified", the admin needs to add your Gmail as a test user in Google Cloud Console.'
      : `Google error: ${googleError}`;
    return Response.redirect(`${url.origin}/agent/settings?gmail=error&reason=${encodeURIComponent(reason)}`, 302);
  }

  if (!code || !userId) {
    return Response.redirect(`${url.origin}/agent/settings?gmail=error&reason=missing_params`, 302);
  }

  try {
    // Read Google credentials from env vars or D1
    let clientId = env.GOOGLE_CLIENT_ID;
    let clientSecret = env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      try {
        const idRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_id'").first();
        const secretRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_secret'").first();
        if (idRow?.value) clientId = idRow.value;
        if (secretRow?.value) clientSecret = secretRow.value;
      } catch {}
    }

    const redirectUri = `${url.origin}/api/agent/gmail/callback`;
    const tokens = await exchangeCode(code, clientId, clientSecret, redirectUri);

    // Encrypt tokens before storing
    const encryptedAccess = await encryptToken(tokens.access_token, env.TOKEN_ENCRYPTION_KEY);
    const encryptedRefresh = await encryptToken(tokens.refresh_token, env.TOKEN_ENCRYPTION_KEY);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Get Gmail email from the access token
    let gmailEmail = 'unknown';
    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (profileRes.ok) {
        const profile: any = await profileRes.json();
        gmailEmail = profile.email || 'unknown';
      }
    } catch {}

    // Upsert gmail_connections
    const existing = await env.DB.prepare('SELECT id FROM gmail_connections WHERE user_id = ?').bind(userId).first();

    if (existing) {
      await env.DB.prepare(
        'UPDATE gmail_connections SET gmail_email = ?, access_token = ?, refresh_token = ?, token_expires_at = ? WHERE user_id = ?'
      ).bind(gmailEmail, encryptedAccess, encryptedRefresh, expiresAt, userId).run();
    } else {
      const id = generateId();
      await env.DB.prepare(
        'INSERT INTO gmail_connections (id, user_id, gmail_email, access_token, refresh_token, token_expires_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, userId, gmailEmail, encryptedAccess, encryptedRefresh, expiresAt).run();
    }

    return Response.redirect(`${url.origin}/agent/settings?gmail=connected`, 302);
  } catch (err: any) {
    console.error('Gmail callback error:', err);
    return Response.redirect(`${url.origin}/agent/settings?gmail=error&reason=${encodeURIComponent(err.message)}`, 302);
  }
}
