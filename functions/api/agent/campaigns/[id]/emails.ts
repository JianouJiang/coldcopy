import { getAuthUser } from '../../../../lib/auth';

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const { results } = await env.DB.prepare(
    `SELECT e.id, e.lead_id, e.subject, e.body, e.status, e.sent_at, e.error, e.created_at,
            e.reply_count, e.last_reply_at, e.gmail_thread_id,
            l.company_name as lead_company_name, l.contact_name as lead_contact_name, l.contact_email as lead_contact_email
     FROM outbound_emails e
     LEFT JOIN leads l ON e.lead_id = l.id
     WHERE e.campaign_id = ?
     ORDER BY e.created_at DESC`
  ).bind(params.id).all();

  return new Response(JSON.stringify(results || []), { headers: { 'content-type': 'application/json' } });
}
