import { getAuthUser, generateId } from '../../../../../../lib/auth';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // Verify ownership chain
  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const email: any = await env.DB.prepare('SELECT id, status FROM outbound_emails WHERE id = ? AND campaign_id = ?').bind(params.eid, params.id).first();
  if (!email) return new Response(JSON.stringify({ error: 'Email not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  if (email.status !== 'draft') return new Response(JSON.stringify({ error: 'Only draft emails can be approved' }), { status: 400, headers: { 'content-type': 'application/json' } });

  await env.DB.prepare("UPDATE outbound_emails SET status = 'approved' WHERE id = ?").bind(params.eid).run();

  // Auto-create send_emails task so the cron picks it up
  const taskId = generateId();
  await env.DB.prepare(
    'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
  ).bind(taskId, params.id, 'send_emails', JSON.stringify({ email_id: params.eid })).run();

  return new Response(JSON.stringify({ success: true, task_id: taskId }), { headers: { 'content-type': 'application/json' } });
}
