import { getAuthUser } from '../../../lib/auth';

// Admin emails — always enterprise
const ADMIN_EMAILS = ['jianou.works@gmail.com'];

// Plan limits
const PLAN_LIMITS = {
  free: {
    max_emails_per_day: 5,
    max_campaigns: 2,
    max_reply_rounds: 4,
    label: 'Free',
  },
  pro: {
    max_emails_per_day: 50,
    max_campaigns: 20,
    max_reply_rounds: 20,
    label: 'Pro',
  },
  enterprise: {
    max_emails_per_day: 500,
    max_campaigns: 100,
    max_reply_rounds: 100,
    label: 'Enterprise',
  },
};

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;

  const authUser = await getAuthUser(request, env);
  if (!authUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'content-type': 'application/json' } });
  }

  const user: any = await env.DB.prepare(
    'SELECT id, email, name, company_intro, plan FROM users WHERE id = ?'
  ).bind(authUser.id).first();

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }),
      { status: 404, headers: { 'content-type': 'application/json' } });
  }

  // Admin override — always enterprise
  const isAdmin = ADMIN_EMAILS.includes(user.email);
  const plan = isAdmin ? 'enterprise' : (user.plan || 'free');
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

  // Get usage stats
  const today = new Date().toISOString().split('T')[0];
  const emailsSentToday: any = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM outbound_emails e JOIN campaigns c ON e.campaign_id = c.id WHERE c.user_id = ? AND e.status = 'sent' AND e.sent_at >= ?"
  ).bind(user.id, today).first();

  const campaignCount: any = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM campaigns WHERE user_id = ?'
  ).bind(user.id).first();

  const totalEmailsSent: any = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM outbound_emails e JOIN campaigns c ON e.campaign_id = c.id WHERE c.user_id = ? AND e.status = 'sent'"
  ).bind(user.id).first();

  const totalReplies: any = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM email_replies r JOIN campaigns c ON r.campaign_id = c.id WHERE c.user_id = ?"
  ).bind(user.id).first();

  // Check Gmail connection status
  const gmailConn: any = await env.DB.prepare(
    'SELECT gmail_email FROM gmail_connections WHERE user_id = ?'
  ).bind(user.id).first();

  return new Response(JSON.stringify({
    ...user,
    plan,
    plan_label: limits.label,
    limits,
    gmail_connected: !!gmailConn,
    gmail_email: gmailConn?.gmail_email || null,
    usage: {
      emails_sent_today: emailsSentToday?.count || 0,
      campaigns: campaignCount?.count || 0,
      total_emails_sent: totalEmailsSent?.count || 0,
      total_replies: totalReplies?.count || 0,
    },
  }), { headers: { 'content-type': 'application/json' } });
}
