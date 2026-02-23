import { getAuthUser, generateId } from '../../../lib/auth';

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const { results } = await env.DB.prepare(
    'SELECT id, name, status, icp_description, leads_found, emails_sent, created_at, updated_at FROM campaigns WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return new Response(JSON.stringify(results || []), { headers: { 'content-type': 'application/json' } });
}

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const body = await request.json();
  const { name, company_intro, icp_description, email_rules, tone, max_emails_per_day, sender_name, sender_title } = body;

  if (!name || !company_intro || !icp_description) {
    return new Response(JSON.stringify({ error: 'name, company_intro, and icp_description are required' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Check Gmail connection before allowing campaign creation
  const gmailConn = await env.DB.prepare(
    'SELECT id FROM gmail_connections WHERE user_id = ?'
  ).bind(user.id).first();

  if (!gmailConn) {
    return new Response(JSON.stringify({ error: 'Gmail not connected. Go to Settings → Connect Gmail before creating a campaign.' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const id = generateId();
  await env.DB.prepare(
    'INSERT INTO campaigns (id, user_id, name, company_intro, icp_description, email_rules, tone, max_emails_per_day, sender_name, sender_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user.id, name, company_intro, icp_description, email_rules || null, tone || 'professional', max_emails_per_day || 20, sender_name || '', sender_title || '').run();

  // Auto-create research_leads task so the pipeline starts immediately
  const taskId = generateId();
  await env.DB.prepare(
    'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
  ).bind(taskId, id, 'research_leads', JSON.stringify({ icp_description, company_intro })).run();

  // Auto-trigger processing via waitUntil so the response returns immediately
  const processUrl = new URL(`/api/agent/campaigns/${id}/process`, request.url);
  context.waitUntil(
    fetch(processUrl.toString(), {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') || '' },
    }).catch(() => {}) // fire-and-forget
  );

  return new Response(JSON.stringify({ id, name, status: 'active' }), { status: 201, headers: { 'content-type': 'application/json' } });
}
