import { getAuthUser, generateId } from '../../../../../../lib/auth';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // Verify ownership chain
  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const reply: any = await env.DB.prepare(
    "SELECT id, campaign_id, ai_reply_status FROM email_replies WHERE id = ? AND campaign_id = ?"
  ).bind(params.rid, params.id).first();
  if (!reply) return new Response(JSON.stringify({ error: 'Reply not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  if (reply.ai_reply_status !== 'draft') {
    return new Response(JSON.stringify({ error: 'Only draft replies can be approved' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Mark as approved
  await env.DB.prepare("UPDATE email_replies SET ai_reply_status = 'approved' WHERE id = ?").bind(params.rid).run();

  // Create send_reply task
  const taskId = generateId();
  await env.DB.prepare(
    'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
  ).bind(taskId, params.id, 'send_reply', JSON.stringify({ reply_id: params.rid })).run();

  return new Response(JSON.stringify({ success: true, task_id: taskId }), { headers: { 'content-type': 'application/json' } });
}
