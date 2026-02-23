import { getAuthUser } from '../../../lib/auth';
import { getGoogleAuthUrl } from '../../../lib/gmail';

// Read Google OAuth credentials from env vars first, fall back to D1 platform_settings
async function getGoogleCredentials(env: any) {
  let clientId = env.GOOGLE_CLIENT_ID;
  let clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    try {
      const idRow: any = await env.DB.prepare(
        "SELECT value FROM platform_settings WHERE key = 'google_client_id'"
      ).first();
      const secretRow: any = await env.DB.prepare(
        "SELECT value FROM platform_settings WHERE key = 'google_client_secret'"
      ).first();
      if (idRow?.value) clientId = idRow.value;
      if (secretRow?.value) clientSecret = secretRow.value;
    } catch {}
  }

  return { clientId, clientSecret };
}

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const { clientId, clientSecret } = await getGoogleCredentials(env);

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'gmail_not_configured' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/agent/gmail/callback`;
  const url = getGoogleAuthUrl(clientId, redirectUri, user.id);

  return new Response(JSON.stringify({ url }), { headers: { 'content-type': 'application/json' } });
}
