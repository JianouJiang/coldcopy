import { getAuthUser } from '../../../../../../lib/auth';

// POST /api/agent/campaigns/:id/replies/:rid/regenerate
// Regenerate the AI suggested reply with user instructions
export async function onRequestPost(context: any): Promise<Response> {
  const { request, env, params } = context;
  const user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });

  const campaign = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND user_id = ?').bind(params.id, user.id).first();
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404, headers: { 'content-type': 'application/json' } });

  const reply: any = await env.DB.prepare(
    'SELECT * FROM email_replies WHERE id = ? AND campaign_id = ?'
  ).bind(params.rid, params.id).first();
  if (!reply) return new Response(JSON.stringify({ error: 'Reply not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  if (reply.ai_reply_status !== 'draft') {
    return new Response(JSON.stringify({ error: 'Only draft replies can be regenerated' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const body = await request.json();
  const instructions = body.instructions || '';

  // Get the outbound email for context
  const outboundEmail: any = await env.DB.prepare(
    'SELECT subject, body FROM outbound_emails WHERE id = ?'
  ).bind(reply.outbound_email_id).first();

  // Get lead info for context
  const lead: any = await env.DB.prepare(
    'SELECT company_name, contact_name, contact_email FROM leads WHERE id = ?'
  ).bind(reply.lead_id).first();

  // Call Claude to regenerate the reply
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      system: `You write follow-up email replies for B2B cold outreach conversations. Write ONLY the reply body text — no subject line, no greeting prefix, no sign-off unless appropriate. Keep it concise (2-4 sentences). Write in English.`,
      messages: [{
        role: 'user',
        content: `Context:
- Original outreach subject: ${outboundEmail?.subject || 'N/A'}
- Original outreach body: ${outboundEmail?.body?.substring(0, 500) || 'N/A'}
- Lead: ${lead?.company_name || 'Unknown'} (${lead?.contact_name || 'Unknown'})
- Their reply: ${reply.body?.substring(0, 1000) || 'N/A'}
- Previous suggested reply: ${reply.ai_suggested_reply || 'None'}

${instructions ? `User instructions for regeneration: ${instructions}` : 'Generate a new alternative reply.'}

Write a new reply to their message.`
      }],
    }),
  });

  if (!claudeRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to regenerate reply' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  const claudeData: any = await claudeRes.json();
  const newReply = claudeData.content?.[0]?.text?.trim() || '';

  if (!newReply) {
    return new Response(JSON.stringify({ error: 'Empty reply generated' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  // Update the suggested reply
  await env.DB.prepare('UPDATE email_replies SET ai_suggested_reply = ? WHERE id = ?')
    .bind(newReply, params.rid).run();

  return new Response(JSON.stringify({ success: true, ai_suggested_reply: newReply }), { headers: { 'content-type': 'application/json' } });
}
