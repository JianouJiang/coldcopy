import { getAuthUser } from '../../../lib/auth';

// DELETE /api/agent/bounces/:bid — Remove a bounce record (unblock address)
export async function onRequestDelete(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // Verify the bounce belongs to this user
  const bounce = await env.DB.prepare(
    'SELECT id FROM email_bounces WHERE id = ? AND user_id = ?'
  ).bind(params.bid, user.id).first();

  if (!bounce) {
    return new Response(JSON.stringify({ error: 'Bounce record not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  }

  await env.DB.prepare('DELETE FROM email_bounces WHERE id = ?').bind(params.bid).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
