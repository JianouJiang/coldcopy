import { getAuthUser } from '../../../../../../lib/auth';

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // Verify ownership chain
  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const email = await env.DB.prepare('SELECT id FROM outbound_emails WHERE id = ? AND campaign_id = ?').bind(params.eid, params.id).first();
  if (!email) return new Response(JSON.stringify({ error: 'Email not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const { results } = await env.DB.prepare(
    'SELECT id, outbound_email_id, from_email, subject, body, received_at, ai_summary, ai_sentiment, ai_suggested_reply, ai_reply_status, created_at FROM email_replies WHERE outbound_email_id = ? ORDER BY received_at ASC'
  ).bind(params.eid).all();

  // Mark replies as read
  await env.DB.prepare('UPDATE email_replies SET is_read = 1 WHERE outbound_email_id = ? AND is_read = 0').bind(params.eid).run();

  return new Response(JSON.stringify(results || []), { headers: { 'content-type': 'application/json' } });
}
