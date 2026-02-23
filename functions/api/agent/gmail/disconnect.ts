import { getAuthUser } from '../../../lib/auth';
import { decryptToken } from '../../../lib/crypto';
import { revokeToken } from '../../../lib/gmail';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const connection: any = await env.DB.prepare(
    'SELECT access_token FROM gmail_connections WHERE user_id = ?'
  ).bind(user.id).first();

  if (connection) {
    try {
      const accessToken = await decryptToken(connection.access_token, env.TOKEN_ENCRYPTION_KEY);
      await revokeToken(accessToken);
    } catch (err) {
      console.error('Token revocation error (non-fatal):', err);
    }

    await env.DB.prepare('DELETE FROM gmail_connections WHERE user_id = ?').bind(user.id).run();
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
