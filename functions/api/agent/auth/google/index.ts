// Google Sign-In: Start OAuth flow for login/signup + Gmail connection in one step
import { getGoogleAuthUrl } from '../../../../lib/gmail';

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
  const { clientId } = await getGoogleCredentials(env);

  if (!clientId) {
    return new Response(JSON.stringify({ error: 'Google OAuth not configured' }), {
      status: 503, headers: { 'content-type': 'application/json' },
    });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/agent/auth/google/callback`;
  // state = "login" to distinguish from settings Gmail connect flow
  const url = getGoogleAuthUrl(clientId, redirectUri, 'login');

  return new Response(JSON.stringify({ url }), {
    headers: { 'content-type': 'application/json' },
  });
}
