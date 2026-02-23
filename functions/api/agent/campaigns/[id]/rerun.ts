// POST /api/agent/campaigns/:id/rerun
// Re-runs the research→find→generate→send pipeline for an existing campaign.
// Finds NEW leads only — skips domains already contacted.

import { getAuthUser, generateId } from '../../../../lib/auth';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'content-type': 'application/json' },
    });
  }

  const campaign: any = await env.DB.prepare(
    'SELECT id, icp_description, company_intro FROM campaigns WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();

  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Campaign not found' }), {
      status: 404, headers: { 'content-type': 'application/json' },
    });
  }

  // Collect domains of ALL existing leads for this campaign to avoid re-searching them
  const { results: existingLeads } = await env.DB.prepare(
    'SELECT company_url FROM leads WHERE campaign_id = ?'
  ).bind(params.id).all();

  const excludeDomains: string[] = [];
  if (existingLeads) {
    const seen = new Set<string>();
    for (const lead of existingLeads as any[]) {
      try {
        const domain = new URL(lead.company_url).hostname.replace('www.', '');
        if (!seen.has(domain)) {
          seen.add(domain);
          excludeDomains.push(domain);
        }
      } catch {}
    }
  }

  // Check if there's already a pending research_leads task for this campaign
  const pendingResearch = await env.DB.prepare(
    `SELECT id FROM agent_tasks WHERE campaign_id = ? AND task_type = 'research_leads' AND status IN ('pending', 'processing')`
  ).bind(params.id).first();

  if (pendingResearch) {
    return new Response(JSON.stringify({ error: 'A research task is already in progress for this campaign' }), {
      status: 409, headers: { 'content-type': 'application/json' },
    });
  }

  // Create research_leads task with rerun flag and excluded domains
  const taskId = generateId();
  await env.DB.prepare(
    'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
  ).bind(
    taskId, params.id, 'research_leads',
    JSON.stringify({
      icp_description: campaign.icp_description,
      company_intro: campaign.company_intro,
      rerun: true,
      exclude_domains: excludeDomains,
    })
  ).run();

  // Set campaign status to active
  await env.DB.prepare(
    "UPDATE campaigns SET status = 'active', updated_at = datetime('now') WHERE id = ?"
  ).bind(params.id).run();

  // Auto-trigger processing
  const processUrl = new URL(`/api/agent/campaigns/${params.id}/process`, request.url);
  context.waitUntil(
    fetch(processUrl.toString(), {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') || '' },
    }).catch(() => {})
  );

  return new Response(JSON.stringify({
    success: true,
    task_id: taskId,
    excluded_domains: excludeDomains.length,
  }), {
    status: 201, headers: { 'content-type': 'application/json' },
  });
}
