import { getAuthUser } from '../../../lib/auth';

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const connection: any = await env.DB.prepare(
    'SELECT gmail_email, token_expires_at FROM gmail_connections WHERE user_id = ?'
  ).bind(user.id).first();

  if (!connection) {
    return new Response(JSON.stringify({ connected: false }), { headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ connected: true, email: connection.gmail_email }), { headers: { 'content-type': 'application/json' } });
}
