// Google Sign-In Callback: Creates account + connects Gmail in one step
import { generateId, createJWT } from '../../../../lib/auth';
import { exchangeCode } from '../../../../lib/gmail';
import { encryptToken } from '../../../../lib/crypto';

async function getGoogleCredentials(env: any) {
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
  return { clientId, clientSecret };
}

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const googleError = url.searchParams.get('error');

  if (googleError) {
    const reason = googleError === 'access_denied'
      ? 'Access denied. The Google app may need to be published. Contact the admin.'
      : `Google error: ${googleError}`;
    return Response.redirect(`${url.origin}/agent/login?error=${encodeURIComponent(reason)}`, 302);
  }

  if (!code) {
    return Response.redirect(`${url.origin}/agent/login?error=${encodeURIComponent('Missing authorization code')}`, 302);
  }

  try {
    const { clientId, clientSecret } = await getGoogleCredentials(env);
    const redirectUri = `${url.origin}/api/agent/auth/google/callback`;
    const tokens = await exchangeCode(code, clientId, clientSecret, redirectUri);

    // Get user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error('Failed to get Google profile');
    const profile: any = await profileRes.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || '';

    if (!email) throw new Error('No email from Google');

    // Check if user exists
    let user: any = await env.DB.prepare(
      'SELECT id, email FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      // Create new user (no password — Google auth only)
      const userId = generateId();
      await env.DB.prepare(
        "INSERT INTO users (id, email, password_hash, name, plan) VALUES (?, ?, ?, ?, 'free')"
      ).bind(userId, email, 'google_oauth', name).run();
      user = { id: userId, email };
    }

    // Encrypt and store Gmail tokens
    const encryptedAccess = await encryptToken(tokens.access_token, env.TOKEN_ENCRYPTION_KEY);
    const encryptedRefresh = await encryptToken(tokens.refresh_token, env.TOKEN_ENCRYPTION_KEY);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const existingGmail = await env.DB.prepare(
      'SELECT id FROM gmail_connections WHERE user_id = ?'
    ).bind(user.id).first();

    if (existingGmail) {
      await env.DB.prepare(
        'UPDATE gmail_connections SET gmail_email = ?, access_token = ?, refresh_token = ?, token_expires_at = ? WHERE user_id = ?'
      ).bind(email, encryptedAccess, encryptedRefresh, expiresAt, user.id).run();
    } else {
      const connId = generateId();
      await env.DB.prepare(
        'INSERT INTO gmail_connections (id, user_id, gmail_email, access_token, refresh_token, token_expires_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(connId, user.id, email, encryptedAccess, encryptedRefresh, expiresAt).run();
    }

    // Create JWT and set auth cookie
    const jwt = await createJWT({ sub: user.id, email: user.email }, env.AGENT_JWT_SECRET);

    const response = Response.redirect(`${url.origin}/agent/dashboard`, 302);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Location', `${url.origin}/agent/dashboard`);
    newResponse.headers.append(
      'Set-Cookie',
      `coldcopy_agent=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
    );
    return newResponse;
  } catch (err: any) {
    console.error('Google sign-in callback error:', err);
    return Response.redirect(
      `${url.origin}/agent/login?error=${encodeURIComponent(err.message || 'Sign-in failed')}`,
      302
    );
  }
}
