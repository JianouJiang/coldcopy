import { getAuthUser } from '../../../lib/auth';

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const campaign: any = await env.DB.prepare(
    'SELECT * FROM campaigns WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();

  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  // Get lead and email counts by status
  const leadStats = await env.DB.prepare(
    'SELECT status, COUNT(*) as count FROM leads WHERE campaign_id = ? GROUP BY status'
  ).bind(params.id).all();

  const emailStats = await env.DB.prepare(
    'SELECT status, COUNT(*) as count FROM outbound_emails WHERE campaign_id = ? GROUP BY status'
  ).bind(params.id).all();

  // Get recent tasks
  const tasks = await env.DB.prepare(
    'SELECT id, task_type, status, error, created_at FROM agent_tasks WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(params.id).all();

  // Get pending reply drafts (replies with AI-generated responses awaiting approval)
  const replyDrafts = await env.DB.prepare(
    "SELECT r.id, r.outbound_email_id, r.lead_id, r.from_email, r.subject, r.body, r.received_at, r.ai_summary, r.ai_sentiment, r.ai_suggested_reply, r.ai_reply_status, l.company_name as lead_company_name, l.contact_name as lead_contact_name FROM email_replies r LEFT JOIN leads l ON r.lead_id = l.id WHERE r.campaign_id = ? AND r.ai_reply_status = 'draft' ORDER BY r.received_at DESC"
  ).bind(params.id).all();

  return new Response(JSON.stringify({ ...campaign, lead_stats: leadStats.results, email_stats: emailStats.results, recent_tasks: tasks.results, reply_drafts: replyDrafts.results }), { headers: { 'content-type': 'application/json' } });
}

export async function onRequestPatch(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  // Verify ownership
  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const body = await request.json();
  const allowed = ['name', 'status', 'email_rules', 'tone', 'max_emails_per_day', 'company_intro', 'icp_description'];
  const updates: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) return new Response(JSON.stringify({ error: 'No valid fields to update' }), { status: 400, headers: { 'content-type': 'application/json' } });

  updates.push("updated_at = datetime('now')");
  values.push(params.id, user.id);

  await env.DB.prepare(
    `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json' } });
}
