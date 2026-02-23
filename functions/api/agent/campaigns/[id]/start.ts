import { getAuthUser, generateId } from '../../../../lib/auth';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const campaign: any = await env.DB.prepare(
    'SELECT id, icp_description, company_intro FROM campaigns WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();

  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  // Create research_leads task
  const taskId = generateId();
  await env.DB.prepare(
    'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
  ).bind(taskId, params.id, 'research_leads', JSON.stringify({ icp_description: campaign.icp_description, company_intro: campaign.company_intro })).run();

  // Update campaign status to active
  await env.DB.prepare("UPDATE campaigns SET status = 'active', updated_at = datetime('now') WHERE id = ?").bind(params.id).run();

  return new Response(JSON.stringify({ success: true, task_id: taskId }), { status: 201, headers: { 'content-type': 'application/json' } });
}
