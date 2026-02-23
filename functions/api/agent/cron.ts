// ColdCopy Agent Mode — Cron Trigger Handler
// Processes the agent task queue. Triggered by:
// 1. External cron service (e.g., cron-job.org calling POST /api/agent/cron)
// 2. Manual trigger from the dashboard

import { generateId } from '../../lib/auth';
import { searchCompanies } from '../../lib/serper';
import { decryptToken, encryptToken } from '../../lib/crypto';
import { sendEmail, replyInThread, refreshAccessToken, getThreadMessages, parseGmailMessage } from '../../lib/gmail';

// Admin emails — always enterprise
const ADMIN_EMAILS = ['jianou.works@gmail.com'];

// Plan limits
const PLAN_LIMITS: Record<string, { max_leads_per_campaign: number; max_emails_per_day: number; max_reply_rounds: number }> = {
  free: { max_leads_per_campaign: 10, max_emails_per_day: 5, max_reply_rounds: 4 },
  pro: { max_leads_per_campaign: 100, max_emails_per_day: 50, max_reply_rounds: 20 },
  enterprise: { max_leads_per_campaign: 500, max_emails_per_day: 500, max_reply_rounds: 100 },
};

function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

function getEffectivePlan(plan: string, email?: string): string {
  if (email && ADMIN_EMAILS.includes(email)) return 'enterprise';
  return plan || 'free';
}

// Generic email prefixes that indicate a department/generic address, not a person
const GENERIC_EMAIL_PREFIXES = [
  'info', 'contact', 'support', 'admin', 'hello', 'team', 'sales',
  'webmaster', 'no-reply', 'noreply', 'office', 'help', 'general',
  'marketing', 'press', 'media', 'feedback', 'service', 'mail',
  'enquiries', 'inquiries', 'reception', 'careers', 'jobs', 'hr',
  'billing', 'accounts', 'dept', 'department', 'web', 'postmaster',
];

function isGenericEmail(email: string): boolean {
  const prefix = email.split('@')[0].toLowerCase();
  return GENERIC_EMAIL_PREFIXES.includes(prefix);
}

// Detect fake/hallucinated placeholder emails
function isObviouslyFakeEmail(email: string): boolean {
  const prefix = email.split('@')[0].toLowerCase().replace(/\./g, '');
  const fakeNames = [
    'person', 'name', 'user', 'your', 'email', 'someone', 'example',
    'firstname', 'lastname', 'firstlast', 'johndoe', 'janedoe',
    'test', 'demo', 'sample', 'placeholder', 'yourname', 'username',
    'yourfirstname', 'yourlastname', 'firstnamelastname',
  ];
  return fakeNames.includes(prefix);
}

// Detect bounce/undeliverable messages from mailer-daemon
function isBounceMessage(from: string, body: string): { isBounce: boolean; reason: string } {
  const fromLower = from.toLowerCase();
  const bounceFromPatterns = ['mailer-daemon', 'postmaster', 'mail delivery subsystem'];
  const isBounceFrom = bounceFromPatterns.some(p => fromLower.includes(p));
  if (!isBounceFrom) return { isBounce: false, reason: '' };

  const reasons = [
    { pattern: /550|address not found|user unknown|no such user|mailbox not found|does not exist/i, reason: 'Address not found' },
    { pattern: /552|mailbox full|over quota|storage/i, reason: 'Mailbox full' },
    { pattern: /554|message rejected|spam|blocked/i, reason: 'Rejected as spam' },
    { pattern: /553|invalid address|bad destination/i, reason: 'Invalid address' },
    { pattern: /delivery.*fail|undeliverable|could not be delivered/i, reason: 'Delivery failed' },
  ];

  for (const { pattern, reason } of reasons) {
    if (pattern.test(body)) return { isBounce: true, reason };
  }

  return { isBounce: true, reason: 'Delivery failed (unspecified)' };
}

// Validate domain has MX records via Cloudflare DNS-over-HTTPS
async function hasValidMX(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { 'Accept': 'application/dns-json' },
    });
    const data: any = await res.json();
    return data.Answer && data.Answer.length > 0;
  } catch {
    return true; // If DNS check fails, don't block (could be network issue)
  }
}

// Simple auth: check for a secret header to prevent unauthorized cron triggers
// In production, set CRON_SECRET via wrangler secret
function verifyCronAuth(request: Request, env: any): boolean {
  const secret = request.headers.get('x-cron-secret');
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) return false;
  return true;
}

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;

  if (!verifyCronAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const results: any[] = [];

  try {
    // Pick up 3 pending tasks, ordered by creation time
    const { results: tasks } = await env.DB.prepare(
      "SELECT * FROM agent_tasks WHERE status = 'pending' AND attempts < 3 ORDER BY created_at ASC LIMIT 3"
    ).all();

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending tasks', processed: 0 }),
        { headers: { 'content-type': 'application/json' } }
      );
    }

    for (const task of tasks as any[]) {
      try {
        // Mark as processing
        await env.DB.prepare(
          "UPDATE agent_tasks SET status = 'processing', attempts = attempts + 1 WHERE id = ?"
        )
          .bind(task.id)
          .run();

        switch (task.task_type) {
          case 'research_leads':
            await processResearchLeads(task, env);
            break;
          case 'find_emails':
            await processFindEmails(task, env);
            break;
          case 'generate_emails':
            await processGenerateEmails(task, env);
            break;
          case 'send_emails':
            await processSendEmails(task, env);
            break;
          case 'check_replies':
            await processCheckReplies(task, env);
            break;
          case 'send_reply':
            await processSendReply(task, env);
            break;
          default:
            throw new Error(`Unknown task type: ${task.task_type}`);
        }

        await env.DB.prepare(
          "UPDATE agent_tasks SET status = 'completed' WHERE id = ?"
        )
          .bind(task.id)
          .run();
        results.push({
          id: task.id,
          type: task.task_type,
          status: 'completed',
        });
      } catch (err: any) {
        console.error(`Task ${task.id} failed:`, err);
        const newStatus = task.attempts >= 2 ? 'failed' : 'pending';
        await env.DB.prepare(
          'UPDATE agent_tasks SET status = ?, error = ? WHERE id = ?'
        )
          .bind(newStatus, err.message, task.id)
          .run();
        results.push({
          id: task.id,
          type: task.task_type,
          status: 'failed',
          error: err.message,
        });
      }
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'content-type': 'application/json' },
  });
}

// --- Task Processors ---

// Domains that are aggregators/listicles, not actual targets
const BLOCKLIST_DOMAINS = [
  // Social / UGC
  'reddit.com', 'quora.com', 'medium.com', 'wikipedia.org', 'youtube.com',
  'facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'instagram.com',
  'tiktok.com', 'pinterest.com',
  // News / media
  'nytimes.com', 'washingtonpost.com', 'bbc.com', 'cnn.com', 'reuters.com',
  'forbes.com', 'businessinsider.com', 'techcrunch.com', 'theguardian.com',
  'wsj.com', 'bloomberg.com', 'huffpost.com',
  // Rankings / listicles
  'niche.com', 'usnews.com', 'princetonreview.com', 'bestvalueschools.com',
  'poetsandquants.com', 'poetsandquantsforundergrads.com',
  'builtin.com', 'greatcollegesprogram.com', 'listwise.com', 'saaspo.com',
  'studylib.net', 'bestcolleges.com', 'collegeconfidential.com',
  // Jobs / reviews
  'glassdoor.com', 'indeed.com', 'crunchbase.com', 'applykite.com',
  'g2.com', 'capterra.com', 'trustpilot.com', 'yelp.com',
  // E-commerce
  'amazon.com', 'ebay.com', 'etsy.com', 'walmart.com',
  // Dev / code
  'github.com', 'stackoverflow.com', 'npmjs.com',
  // Forums / aggregators
  'imechanica.org', 'researchgate.net', 'academia.edu',
  // Font / asset CDNs (false positive emails)
  'indiantypefoundry.com', 'fonts.google.com', 'typekit.com',
  'saaslandingpage.com', 'marketermilk.com',
];

function isBlocklistedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return BLOCKLIST_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

async function generateSearchQueries(icp: string, companyIntro: string, env: any, excludeDomains?: string[]): Promise<string[]> {
  const excludeNote = excludeDomains && excludeDomains.length > 0
    ? `\n- IMPORTANT: This is a RE-RUN. The following domains have already been contacted, generate queries that will find DIFFERENT companies: ${excludeDomains.slice(0, 20).join(', ')}${excludeDomains.length > 20 ? '...' : ''}`
    : '';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        system: `You generate Google search queries to find real companies and their team/about pages where contact emails can be found.

CRITICAL: You are NOT looking for articles, guides, career pages, or educational content.
You ARE looking for actual company websites — specifically their "Team", "About Us", "Contact", or "Staff" pages.

Rules:
- Return exactly 3 search queries, one per line
- Each query MUST include terms that find company pages: "our team" OR "about us" OR "meet the team" OR "staff" OR "contact us"
- Add negative terms to filter articles: -careers -"how to" -guide -degree -salary -jobs -hiring -reddit -quora
- Make queries specific to the ICP industry and role
- Include site: operators when useful (e.g. site:edu for professors)${excludeNote}
- Output ONLY the 3 queries, nothing else`,
        messages: [{
          role: 'user',
          content: `About the sender: ${companyIntro || 'N/A'}
Target profile (ICP): ${icp}

Generate 3 Google search queries to find actual company team/about pages matching this ICP. NOT articles, guides, or educational content.${excludeDomains && excludeDomains.length > 0 ? ' Find DIFFERENT companies than: ' + excludeDomains.slice(0, 10).join(', ') : ''}`
        }],
      }),
    });

    if (!res.ok) throw new Error('Claude API error');
    const data: any = await res.json();
    const text = data.content?.[0]?.text || '';
    const queries = text.split('\n').map((q: string) => q.replace(/^\d+[\.\)]\s*/, '').trim()).filter((q: string) => q.length > 5);
    return queries.slice(0, 3);
  } catch {
    // Fallback: simple query
    return [`${icp} contact email`];
  }
}

async function processResearchLeads(task: any, env: any) {
  const payload = JSON.parse(task.payload || '{}');
  const { icp_description, company_intro, rerun, exclude_domains } = payload;

  // Get user plan to enforce lead limits
  const campaign: any = await env.DB.prepare('SELECT user_id FROM campaigns WHERE id = ?').bind(task.campaign_id).first();
  const userRow: any = campaign ? await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(campaign.user_id).first() : null;
  const limits = getPlanLimits(userRow?.plan || 'free');

  // For reruns: only count leads that actually yielded emails against the limit.
  // This lets a campaign with 10 leads but only 1 email found search for more.
  let slotsRemaining: number;
  if (rerun) {
    const successLeadCount: any = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE campaign_id = ? AND status IN ('email_found', 'email_generated', 'sent')"
    ).bind(task.campaign_id).first();
    const successLeads = successLeadCount?.count || 0;
    slotsRemaining = limits.max_leads_per_campaign - successLeads;
    if (slotsRemaining <= 0) {
      console.log(`Rerun lead limit reached (${successLeads} successful/${limits.max_leads_per_campaign}) for campaign ${task.campaign_id}`);
      return;
    }
  } else {
    const leadCount: any = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM leads WHERE campaign_id = ?'
    ).bind(task.campaign_id).first();
    const currentLeads = leadCount?.count || 0;
    if (currentLeads >= limits.max_leads_per_campaign) {
      console.log(`Lead limit reached (${currentLeads}/${limits.max_leads_per_campaign}) for campaign ${task.campaign_id}`);
      return;
    }
    slotsRemaining = limits.max_leads_per_campaign - currentLeads;
  }

  // Collect existing lead domains for domain-level dedup
  const { results: existingLeadRows } = await env.DB.prepare(
    'SELECT company_url FROM leads WHERE campaign_id = ?'
  ).bind(task.campaign_id).all();
  const existingDomains = new Set<string>();
  if (existingLeadRows) {
    for (const row of existingLeadRows as any[]) {
      try {
        existingDomains.add(new URL(row.company_url).hostname.replace('www.', ''));
      } catch {}
    }
  }

  // Use AI to generate smart search queries (pass exclude domains for reruns)
  const queries = await generateSearchQueries(
    icp_description, company_intro || '', env,
    rerun ? (exclude_domains || Array.from(existingDomains)) : undefined
  );

  // Run all queries and combine results (20 per query for better coverage)
  const allResults: any[] = [];
  for (const query of queries) {
    const results = await searchCompanies(query, env.SERPER_API_KEY, 20);
    allResults.push(...results);
  }

  // Deduplicate by URL, filter blocklisted domains, and skip already-known domains
  const seen = new Set<string>();
  let filteredResults = allResults.filter(r => {
    if (!r.link || seen.has(r.link) || isBlocklistedUrl(r.link)) return false;
    // Domain-level dedup: skip results whose domain we already have a lead for
    try {
      const domain = new URL(r.link).hostname.replace('www.', '');
      if (existingDomains.has(domain)) return false;
    } catch {}
    seen.add(r.link);
    return true;
  });

  if (filteredResults.length === 0) {
    throw new Error('No relevant search results found for ICP');
  }

  // AI-powered filtering: remove articles/guides, keep company/person pages
  try {
    const classifyRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: `Classify each search result as KEEP or SKIP.
KEEP: Company websites, team/about pages, personal websites, organization pages with real people, consulting firms, agencies
SKIP: Articles, guides, listicles, career advice, "how to" pages, educational content, news articles, degree/salary pages, Wikipedia, forums
Respond with one line per result: just KEEP or SKIP, in order.`,
        messages: [{
          role: 'user',
          content: JSON.stringify(filteredResults.map(r => ({ title: r.title, url: r.link, snippet: r.snippet }))),
        }],
      }),
    });
    if (classifyRes.ok) {
      const classifyData: any = await classifyRes.json();
      const classifications = (classifyData.content?.[0]?.text || '').split('\n').map((l: string) => l.trim().toUpperCase());
      if (classifications.length >= filteredResults.length) {
        filteredResults = filteredResults.filter((_, i) => classifications[i] !== 'SKIP');
      }
    }
  } catch {}

  if (filteredResults.length === 0) {
    throw new Error('No relevant company pages found after AI filtering');
  }

  let leadsCreated = 0;
  for (const result of filteredResults) {
    // Enforce lead limit
    if (leadsCreated >= slotsRemaining) break;

    // Skip if domain already exists for this campaign
    const existing = await env.DB.prepare(
      'SELECT id FROM leads WHERE campaign_id = ? AND company_url = ?'
    )
      .bind(task.campaign_id, result.link)
      .first();
    if (existing) continue;

    const leadId = generateId();
    await env.DB.prepare(
      'INSERT INTO leads (id, campaign_id, company_name, company_url, company_description, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        leadId,
        task.campaign_id,
        result.title,
        result.link,
        result.snippet,
        'web_search',
        'new'
      )
      .run();

    // Create find_emails task for this lead
    const findTaskId = generateId();
    await env.DB.prepare(
      'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
    )
      .bind(
        findTaskId,
        task.campaign_id,
        'find_emails',
        JSON.stringify({ lead_id: leadId })
      )
      .run();

    leadsCreated++;
  }

  // Update campaign leads_found count
  await env.DB.prepare(
    "UPDATE campaigns SET leads_found = leads_found + ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(leadsCreated, task.campaign_id)
    .run();
}

async function processFindEmails(task: any, env: any) {
  const payload = JSON.parse(task.payload || '{}');
  const { lead_id } = payload;

  const lead: any = await env.DB.prepare(
    'SELECT * FROM leads WHERE id = ?'
  )
    .bind(lead_id)
    .first();
  if (!lead || !lead.company_url) throw new Error('Lead or URL not found');

  let researchData: any = { url: lead.company_url };
  let contactEmail: string | null = null;
  let contactName: string | null = null;
  let pageText = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(lead.company_url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ColdCopy/1.0)' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      pageText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      researchData.title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
      researchData.description = (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || [])[1] || '';
      researchData.text_preview = pageText.substring(0, 2000);

      // Find ALL emails via regex
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const allEmails = html.match(emailRegex) || [];
      // Filter out junk
      const validEmails = allEmails.filter(
        (e: string) =>
          !e.includes('example.com') &&
          !e.includes('wixpress') &&
          !e.includes('sentry') &&
          !e.endsWith('.png') &&
          !e.endsWith('.jpg') &&
          !e.endsWith('.js') &&
          !e.endsWith('.css')
      );

      // Separate personal vs generic emails
      const personalEmails = validEmails.filter((e: string) => !isGenericEmail(e) && !isObviouslyFakeEmail(e));

      // Prefer personal emails over generic ones
      if (personalEmails.length > 0) {
        contactEmail = personalEmails[0];
      }
      // Do NOT fall back to generic info@ emails

      researchData.emails_found = validEmails.slice(0, 5);
      researchData.personal_emails = personalEmails.slice(0, 5);
    }
  } catch (err: any) {
    researchData.fetch_error = err.message;
  }

  // Multi-page discovery: if no email found on main page, try common subpages
  if (!contactEmail) {
    try {
      const baseUrl = new URL(lead.company_url).origin;
      const subpages = ['/about', '/team', '/contact', '/about-us', '/our-team', '/contact-us', '/people', '/staff'];

      for (const path of subpages) {
        if (contactEmail) break;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const subRes = await fetch(baseUrl + path, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ColdCopy/1.0)' },
            redirect: 'follow',
          });
          clearTimeout(timeout);

          if (subRes.ok) {
            const subHtml = await subRes.text();
            const subText = subHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

            // Merge page text for AI extraction later
            if (!pageText && subText.length > 100) {
              pageText = subText;
            }

            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const subEmails = subHtml.match(emailRegex) || [];
            const subValid = subEmails.filter(
              (e: string) =>
                !e.includes('example.com') && !e.includes('wixpress') && !e.includes('sentry') &&
                !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.js') && !e.endsWith('.css')
            );
            const subPersonal = subValid.filter((e: string) => !isGenericEmail(e) && !isObviouslyFakeEmail(e));

            if (subPersonal.length > 0) {
              contactEmail = subPersonal[0];
              researchData.email_source_page = baseUrl + path;
              researchData.personal_emails = subPersonal.slice(0, 5);
            }
          }
        } catch {}
      }
    } catch {}
  }

  // If we have a personal email, try to extract the person's name using AI
  if (contactEmail && pageText) {
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 200,
          system: `Extract the name of the person whose email is ${contactEmail} from this web page content. If you can identify their name, respond with ONLY their full name (e.g. "John Smith"). If you cannot determine their name, respond with "UNKNOWN".`,
          messages: [{ role: 'user', content: pageText.substring(0, 3000) }],
        }),
      });
      if (aiRes.ok) {
        const aiData: any = await aiRes.json();
        const name = aiData.content?.[0]?.text?.trim() || '';
        if (name && name !== 'UNKNOWN' && name.length < 60) {
          contactName = name;
        }
      }
    } catch {}
  }

  // If no personal email found from scraping, try AI extraction as last resort
  if (!contactEmail && pageText) {
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 200,
          system: `Extract ONLY an email address that LITERALLY appears in the text below.
Do NOT guess, construct, or invent email addresses.
Do NOT create emails from names (e.g., don't turn "John Smith at Acme" into john@acme.com).
The email must be a VERBATIM string from the text, belonging to a real person (not info@, contact@, support@, etc.).

If a personal email literally appears in the text, respond:
EMAIL: the-exact-email@domain.com
NAME: Full Name (if visible near the email)
If no personal email literally appears in the text, respond:
EMAIL: NONE
NAME: NONE`,
          messages: [{ role: 'user', content: pageText.substring(0, 3000) }],
        }),
      });
      if (aiRes.ok) {
        const aiData: any = await aiRes.json();
        const text = aiData.content?.[0]?.text || '';
        const emailMatch = text.match(/EMAIL:\s*(\S+@\S+)/);
        const nameMatch = text.match(/NAME:\s*(.+)/);
        if (emailMatch && emailMatch[1] !== 'NONE' && !isGenericEmail(emailMatch[1]) && !isObviouslyFakeEmail(emailMatch[1])) {
          contactEmail = emailMatch[1].trim();
          if (nameMatch && nameMatch[1] !== 'NONE') {
            contactName = nameMatch[1].trim();
          }
        }
      }
    } catch {}
  }

  // Final validation: check MX records for the email domain
  if (contactEmail) {
    const domain = contactEmail.split('@')[1];
    if (domain && !(await hasValidMX(domain))) {
      contactEmail = null; // Reject — domain has no mail server
    }
  }

  // Update lead — only proceed if we found a REAL personal email
  const newStatus = contactEmail ? 'email_found' : 'researched';
  await env.DB.prepare(
    'UPDATE leads SET research_data = ?, contact_email = ?, contact_name = COALESCE(?, contact_name), status = ? WHERE id = ?'
  )
    .bind(JSON.stringify(researchData), contactEmail, contactName, newStatus, lead_id)
    .run();

  // Only create generate_emails task if we found a personal email
  if (contactEmail) {
    const genTaskId = generateId();
    await env.DB.prepare(
      'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
    )
      .bind(genTaskId, task.campaign_id, 'generate_emails', JSON.stringify({ lead_id }))
      .run();
  }
}

async function processGenerateEmails(task: any, env: any) {
  const payload = JSON.parse(task.payload || '{}');
  const { lead_id } = payload;

  const lead: any = await env.DB.prepare(
    'SELECT * FROM leads WHERE id = ?'
  )
    .bind(lead_id)
    .first();
  if (!lead) throw new Error('Lead not found');

  const campaign: any = await env.DB.prepare(
    'SELECT * FROM campaigns WHERE id = ?'
  )
    .bind(task.campaign_id)
    .first();
  if (!campaign) throw new Error('Campaign not found');

  // Fetch user for fallback sender name + plan check
  const user: any = await env.DB.prepare(
    'SELECT name, plan FROM users WHERE id = ?'
  )
    .bind(campaign.user_id)
    .first();

  // Check plan-based daily draft limit (same as send limit — no point generating more drafts than you can send)
  const planLimits = getPlanLimits(user?.plan || 'free');
  const today = new Date().toISOString().split('T')[0];
  const draftsToday: any = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM outbound_emails e JOIN campaigns c ON e.campaign_id = c.id WHERE c.user_id = ? AND e.created_at >= ?"
  ).bind(campaign.user_id, today).first();
  if (draftsToday && draftsToday.count >= planLimits.max_emails_per_day) {
    throw new Error(`LIMIT_REACHED: Daily email limit reached (${planLimits.max_emails_per_day}/day on ${user?.plan || 'free'} plan). Upgrade for more.`);
  }

  const researchData = JSON.parse(lead.research_data || '{}');

  // Resolve sender name: campaign field > user name > fallback
  const senderName = campaign.sender_name || user?.name || 'the team';
  const senderTitle = campaign.sender_title || '';

  // Call Claude to generate personalized email
  const systemPrompt = `You are an expert cold email writer for B2B SaaS companies.

CRITICAL RULES:
1. Write the email ENTIRELY in English. Do not use any other language regardless of input language.
2. NEVER use placeholder brackets like [Name], [Title], [Company], [Your Name], etc. Use the actual data provided.
3. If the contact name is unknown, use a natural greeting like "Hi there" or "Hello".
4. The sender's name is: ${senderName}${senderTitle ? ` (${senderTitle})` : ''}. Use this real name in the sign-off.
5. Keep the email under 150 words.
6. Reference something specific about the recipient's company.
7. Have a clear, low-friction call to action.
8. Sound human, not like a template.
9. Separate paragraphs with blank lines.

Respond in EXACTLY this format (use these exact delimiters):
SUBJECT: your subject line here
---BODY---
your email body here with paragraphs separated by blank lines`;

  const contactGreeting = lead.contact_name
    ? `Hi ${lead.contact_name.split(' ')[0]}`
    : 'Hi there';

  const userPrompt = `Write a cold email for this outreach:

SENDER: ${senderName}${senderTitle ? `, ${senderTitle}` : ''}
SENDER COMPANY: ${campaign.company_intro}

TARGET COMPANY: ${lead.company_name}
TARGET WEBSITE: ${lead.company_url || 'N/A'}
ABOUT THEM: ${researchData.description || researchData.text_preview?.substring(0, 500) || lead.company_description || 'N/A'}
CONTACT NAME: ${lead.contact_name || 'Unknown'}
CONTACT EMAIL: ${lead.contact_email || 'N/A'}
SUGGESTED GREETING: ${contactGreeting}

ICP: ${campaign.icp_description}
TONE: ${campaign.tone || 'professional'}
${campaign.email_rules ? `ADDITIONAL RULES: ${campaign.email_rules}` : ''}

Generate a personalized cold email in English. Sign off with the sender's real name (${senderName}).`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!claudeRes.ok) {
    throw new Error(`Claude API error: ${claudeRes.status}`);
  }

  const claudeData: any = await claudeRes.json();
  const content = claudeData.content?.[0]?.text || '';

  // Parse delimiter-based response
  const subjectMatch = content.match(/SUBJECT:\s*(.+)/);
  const bodyMatch = content.split('---BODY---');
  if (!subjectMatch || bodyMatch.length < 2) {
    throw new Error('Could not parse Claude response format');
  }

  const emailData = {
    subject: subjectMatch[1].trim(),
    body: bodyMatch[1].trim(),
  };
  if (!emailData.subject || !emailData.body)
    throw new Error('Missing subject or body in response');

  // Insert outbound email as draft
  const emailId = generateId();
  await env.DB.prepare(
    'INSERT INTO outbound_emails (id, lead_id, campaign_id, subject, body, status) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(
      emailId,
      lead_id,
      task.campaign_id,
      emailData.subject,
      emailData.body,
      'draft'
    )
    .run();

  // Update lead status
  await env.DB.prepare(
    "UPDATE leads SET status = 'email_generated' WHERE id = ?"
  )
    .bind(lead_id)
    .run();
}

async function processSendEmails(task: any, env: any) {
  const payload = JSON.parse(task.payload || '{}');
  const { email_id } = payload;

  const email: any = await env.DB.prepare(
    "SELECT * FROM outbound_emails WHERE id = ? AND status = 'approved'"
  )
    .bind(email_id)
    .first();
  if (!email) throw new Error('Approved email not found');

  const lead: any = await env.DB.prepare(
    'SELECT * FROM leads WHERE id = ?'
  )
    .bind(email.lead_id)
    .first();
  if (!lead || !lead.contact_email) throw new Error('Lead email not found');

  const campaign: any = await env.DB.prepare(
    'SELECT * FROM campaigns WHERE id = ?'
  )
    .bind(email.campaign_id)
    .first();
  if (!campaign) throw new Error('Campaign not found');

  // Check bounce blocklist before sending
  const bounced = await env.DB.prepare(
    'SELECT id FROM email_bounces WHERE user_id = ? AND email_address = ?'
  ).bind(campaign.user_id, lead.contact_email).first();
  if (bounced) {
    await env.DB.prepare("UPDATE outbound_emails SET status = 'blocked', error = 'Blocked: previously bounced' WHERE id = ?").bind(email.id).run();
    return;
  }

  // Check plan-based daily send limit
  const userRow: any = await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(campaign.user_id).first();
  const planLimits = getPlanLimits(userRow?.plan || 'free');

  const today = new Date().toISOString().split('T')[0];
  const sentToday: any = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM outbound_emails e JOIN campaigns c ON e.campaign_id = c.id WHERE c.user_id = ? AND e.status = 'sent' AND e.sent_at >= ?"
  )
    .bind(campaign.user_id, today)
    .first();

  // Use plan limit as the daily cap (enterprise = 500/day, pro = 50, free = 5)
  const dailyLimit = planLimits.max_emails_per_day;
  if (sentToday && sentToday.count >= dailyLimit) {
    throw new Error(`LIMIT_REACHED: Daily send limit reached (${dailyLimit}/day on ${userRow?.plan || 'free'} plan). Upgrade for more.`);
  }

  // Get Gmail connection for campaign owner
  const gmailConn: any = await env.DB.prepare(
    'SELECT * FROM gmail_connections WHERE user_id = ?'
  )
    .bind(campaign.user_id)
    .first();
  if (!gmailConn) throw new Error('Gmail not connected');

  // Read Google credentials from env vars or D1
  let gClientId = env.GOOGLE_CLIENT_ID;
  let gClientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!gClientId || !gClientSecret) {
    try {
      const idRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_id'").first();
      const secretRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_secret'").first();
      if (idRow?.value) gClientId = idRow.value;
      if (secretRow?.value) gClientSecret = secretRow.value;
    } catch {}
  }

  // Check if token needs refresh
  let accessToken: string;
  const tokenExpiry = new Date(gmailConn.token_expires_at);

  if (tokenExpiry < new Date()) {
    // Refresh token
    const refreshToken = await decryptToken(
      gmailConn.refresh_token,
      env.TOKEN_ENCRYPTION_KEY
    );
    const newTokens = await refreshAccessToken(
      refreshToken,
      gClientId,
      gClientSecret
    );
    accessToken = newTokens.access_token;

    // Store updated access token
    const encryptedAccess = await encryptToken(
      accessToken,
      env.TOKEN_ENCRYPTION_KEY
    );
    const newExpiry = new Date(
      Date.now() + newTokens.expires_in * 1000
    ).toISOString();
    await env.DB.prepare(
      'UPDATE gmail_connections SET access_token = ?, token_expires_at = ? WHERE user_id = ?'
    )
      .bind(encryptedAccess, newExpiry, campaign.user_id)
      .run();
  } else {
    accessToken = await decryptToken(
      gmailConn.access_token,
      env.TOKEN_ENCRYPTION_KEY
    );
  }

  // Send email via Gmail API
  const { messageId, threadId } = await sendEmail(
    accessToken,
    gmailConn.gmail_email,
    lead.contact_email,
    email.subject,
    email.body
  );

  // Update email status with thread ID for reply tracking
  await env.DB.prepare(
    "UPDATE outbound_emails SET status = 'sent', gmail_message_id = ?, gmail_thread_id = ?, sent_at = datetime('now') WHERE id = ?"
  )
    .bind(messageId, threadId, email.id)
    .run();

  // Update lead status
  await env.DB.prepare(
    "UPDATE leads SET status = 'sent' WHERE id = ?"
  )
    .bind(email.lead_id)
    .run();

  // Update campaign emails_sent count
  await env.DB.prepare(
    "UPDATE campaigns SET emails_sent = emails_sent + 1, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(email.campaign_id)
    .run();

  // Schedule a check_replies task to look for responses later
  const checkTaskId = generateId();
  await env.DB.prepare(
    'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
  )
    .bind(
      checkTaskId,
      email.campaign_id,
      'check_replies',
      JSON.stringify({ campaign_id: email.campaign_id })
    )
    .run();
}

async function processCheckReplies(task: any, env: any) {
  const payload = JSON.parse(task.payload || '{}');
  const campaignId = payload.campaign_id || task.campaign_id;

  // Find all sent emails with thread IDs for this campaign
  const { results: sentEmails } = await env.DB.prepare(
    "SELECT id, lead_id, campaign_id, gmail_thread_id, gmail_message_id FROM outbound_emails WHERE campaign_id = ? AND status = 'sent' AND gmail_thread_id IS NOT NULL AND gmail_thread_id != ''"
  )
    .bind(campaignId)
    .all();

  if (!sentEmails || sentEmails.length === 0) return;

  // Get campaign to find user
  const campaign: any = await env.DB.prepare(
    'SELECT user_id FROM campaigns WHERE id = ?'
  )
    .bind(campaignId)
    .first();
  if (!campaign) throw new Error('Campaign not found');

  // Get Gmail connection
  const gmailConn: any = await env.DB.prepare(
    'SELECT * FROM gmail_connections WHERE user_id = ?'
  )
    .bind(campaign.user_id)
    .first();
  if (!gmailConn) throw new Error('Gmail not connected');

  // Get Google credentials
  let gClientId = env.GOOGLE_CLIENT_ID;
  let gClientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!gClientId || !gClientSecret) {
    try {
      const idRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_id'").first();
      const secretRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_secret'").first();
      if (idRow?.value) gClientId = idRow.value;
      if (secretRow?.value) gClientSecret = secretRow.value;
    } catch {}
  }

  // Get access token (refresh if needed)
  let accessToken: string;
  const tokenExpiry = new Date(gmailConn.token_expires_at);
  if (tokenExpiry < new Date()) {
    const refreshToken = await decryptToken(gmailConn.refresh_token, env.TOKEN_ENCRYPTION_KEY);
    const newTokens = await refreshAccessToken(refreshToken, gClientId, gClientSecret);
    accessToken = newTokens.access_token;
    const encryptedAccess = await encryptToken(accessToken, env.TOKEN_ENCRYPTION_KEY);
    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    await env.DB.prepare('UPDATE gmail_connections SET access_token = ?, token_expires_at = ? WHERE user_id = ?')
      .bind(encryptedAccess, newExpiry, campaign.user_id).run();
  } else {
    accessToken = await decryptToken(gmailConn.access_token, env.TOKEN_ENCRYPTION_KEY);
  }

  // Get user plan for reply round limits
  const userPlanRow: any = await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(campaign.user_id).first();
  const replyLimits = getPlanLimits(userPlanRow?.plan || 'free');

  let newRepliesFound = 0;

  for (const email of sentEmails as any[]) {
    try {
      // Check reply round limit for this thread
      const existingReplies: any = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM email_replies WHERE outbound_email_id = ?'
      ).bind(email.id).first();

      if (existingReplies && existingReplies.count >= replyLimits.max_reply_rounds) {
        continue; // Skip — reply round limit reached for this thread
      }

      const messages = await getThreadMessages(accessToken, email.gmail_thread_id);

      // Skip the original sent message, find new replies
      for (const msg of messages) {
        if (msg.id === email.gmail_message_id) continue;

        // Check if we already stored this reply
        const existing = await env.DB.prepare(
          'SELECT id FROM email_replies WHERE gmail_message_id = ?'
        ).bind(msg.id).first();
        if (existing) continue;

        const parsed = parseGmailMessage(msg);

        // Skip messages from ourselves
        if (parsed.from.includes(gmailConn.gmail_email)) continue;

        // Bounce detection: check if this is a mailer-daemon bounce message
        const bounceCheck = isBounceMessage(parsed.from, parsed.body);
        if (bounceCheck.isBounce) {
          // Get the lead's contact email to add to blocklist
          const bouncedLead: any = await env.DB.prepare('SELECT contact_email FROM leads WHERE id = ?').bind(email.lead_id).first();
          if (bouncedLead?.contact_email) {
            // Insert into email_bounces blocklist
            const bounceId = generateId();
            await env.DB.prepare(
              'INSERT OR IGNORE INTO email_bounces (id, user_id, email_address, bounce_type, reason, source_campaign_id, source_outbound_email_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(bounceId, campaign.user_id, bouncedLead.contact_email, 'hard', bounceCheck.reason, email.campaign_id, email.id).run();
          }
          // Mark outbound email as bounced
          await env.DB.prepare("UPDATE outbound_emails SET status = 'bounced', error = ? WHERE id = ?")
            .bind('Bounced: ' + bounceCheck.reason, email.id).run();
          // Mark lead as bounced
          await env.DB.prepare("UPDATE leads SET status = 'bounced' WHERE id = ?").bind(email.lead_id).run();
          continue; // Skip normal reply processing for bounce messages
        }

        // Use AI to analyze the reply
        let aiSummary = '';
        let aiSentiment = 'neutral';
        let aiSuggestedReply = '';

        try {
          const analysisRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 512,
              system: `You analyze email replies to cold outreach emails. Respond in this exact JSON format:
{"summary":"1-2 sentence summary of their reply","sentiment":"positive|negative|neutral","suggested_reply":"A brief suggested follow-up response (2-3 sentences, in English)"}
Only output valid JSON, nothing else.`,
              messages: [{
                role: 'user',
                content: `Original outreach subject: ${email.subject || 'N/A'}
Reply from: ${parsed.from}
Reply body:
${parsed.body.substring(0, 1000)}`
              }],
            }),
          });

          if (analysisRes.ok) {
            const analysisData: any = await analysisRes.json();
            const analysisText = analysisData.content?.[0]?.text || '';
            try {
              const analysis = JSON.parse(analysisText);
              aiSummary = analysis.summary || '';
              aiSentiment = analysis.sentiment || 'neutral';
              aiSuggestedReply = analysis.suggested_reply || '';
            } catch {}
          }
        } catch {}

        // Determine reply status: if AI generated a response and sentiment isn't negative, mark as draft for auto-approval
        const replyStatus = (aiSuggestedReply && aiSentiment !== 'negative') ? 'draft' : null;

        // Store the reply
        const replyId = generateId();
        await env.DB.prepare(
          'INSERT INTO email_replies (id, outbound_email_id, campaign_id, lead_id, gmail_message_id, from_email, subject, body, body_html, received_at, ai_summary, ai_sentiment, ai_suggested_reply, ai_reply_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          replyId, email.id, email.campaign_id, email.lead_id,
          msg.id, parsed.from, parsed.subject, parsed.body, parsed.bodyHtml,
          parsed.date || new Date().toISOString(),
          aiSummary, aiSentiment, aiSuggestedReply, replyStatus
        ).run();

        // Update outbound_emails reply count
        await env.DB.prepare(
          "UPDATE outbound_emails SET reply_count = reply_count + 1, last_reply_at = datetime('now') WHERE id = ?"
        ).bind(email.id).run();

        newRepliesFound++;
      }
    } catch (err: any) {
      console.error(`Failed to check replies for email ${email.id}:`, err);
    }
  }

  if (newRepliesFound > 0) {
    console.log(`Found ${newRepliesFound} new replies for campaign ${campaignId}`);
  }

  // Self-schedule next check if campaign still has active threads
  const activeThreads: any = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM outbound_emails
     WHERE campaign_id = ? AND status = 'sent' AND gmail_thread_id IS NOT NULL`
  ).bind(campaignId).first();

  if (activeThreads?.count > 0) {
    // Only create if no pending check_replies already exists for this campaign
    const existingCheck = await env.DB.prepare(
      `SELECT id FROM agent_tasks WHERE campaign_id = ? AND task_type = 'check_replies' AND status = 'pending'`
    ).bind(campaignId).first();

    if (!existingCheck) {
      const nextCheckId = generateId();
      await env.DB.prepare(
        'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
      ).bind(nextCheckId, campaignId, 'check_replies', JSON.stringify({ campaign_id: campaignId })).run();
    }
  }
}

async function processSendReply(task: any, env: any) {
  const payload = JSON.parse(task.payload || '{}');
  const { reply_id } = payload;

  const reply: any = await env.DB.prepare(
    "SELECT * FROM email_replies WHERE id = ? AND ai_reply_status = 'approved'"
  ).bind(reply_id).first();
  if (!reply) throw new Error('Approved reply not found');

  const outboundEmail: any = await env.DB.prepare(
    'SELECT * FROM outbound_emails WHERE id = ?'
  ).bind(reply.outbound_email_id).first();
  if (!outboundEmail) throw new Error('Original email not found');

  const campaign: any = await env.DB.prepare(
    'SELECT * FROM campaigns WHERE id = ?'
  ).bind(reply.campaign_id).first();
  if (!campaign) throw new Error('Campaign not found');

  // Check reply round limits
  const userRow: any = await env.DB.prepare('SELECT plan FROM users WHERE id = ?').bind(campaign.user_id).first();
  const limits = getPlanLimits(userRow?.plan || 'free');

  const sentReplies: any = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM email_replies WHERE outbound_email_id = ? AND ai_reply_status = 'sent'"
  ).bind(reply.outbound_email_id).first();
  if (sentReplies && sentReplies.count >= limits.max_reply_rounds) {
    throw new Error(`LIMIT_REACHED: Reply round limit reached (${limits.max_reply_rounds} on ${userRow?.plan || 'free'} plan). Upgrade for more.`);
  }

  // Get Gmail connection
  const gmailConn: any = await env.DB.prepare(
    'SELECT * FROM gmail_connections WHERE user_id = ?'
  ).bind(campaign.user_id).first();
  if (!gmailConn) throw new Error('Gmail not connected');

  let gClientId = env.GOOGLE_CLIENT_ID;
  let gClientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!gClientId || !gClientSecret) {
    try {
      const idRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_id'").first();
      const secretRow: any = await env.DB.prepare("SELECT value FROM platform_settings WHERE key = 'google_client_secret'").first();
      if (idRow?.value) gClientId = idRow.value;
      if (secretRow?.value) gClientSecret = secretRow.value;
    } catch {}
  }

  // Get access token (refresh if needed)
  let accessToken: string;
  const tokenExpiry = new Date(gmailConn.token_expires_at);
  if (tokenExpiry < new Date()) {
    const refreshToken = await decryptToken(gmailConn.refresh_token, env.TOKEN_ENCRYPTION_KEY);
    const newTokens = await refreshAccessToken(refreshToken, gClientId, gClientSecret);
    accessToken = newTokens.access_token;
    const encryptedAccess = await encryptToken(accessToken, env.TOKEN_ENCRYPTION_KEY);
    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    await env.DB.prepare('UPDATE gmail_connections SET access_token = ?, token_expires_at = ? WHERE user_id = ?')
      .bind(encryptedAccess, newExpiry, campaign.user_id).run();
  } else {
    accessToken = await decryptToken(gmailConn.access_token, env.TOKEN_ENCRYPTION_KEY);
  }

  // Send reply in the same Gmail thread
  await replyInThread(
    accessToken,
    gmailConn.gmail_email,
    reply.from_email,
    outboundEmail.subject,
    reply.ai_suggested_reply,
    outboundEmail.gmail_thread_id
  );

  // Mark reply as sent
  await env.DB.prepare(
    "UPDATE email_replies SET ai_reply_status = 'sent' WHERE id = ?"
  ).bind(reply_id).run();

  // Schedule another check_replies to continue the conversation
  const checkTaskId = generateId();
  await env.DB.prepare(
    'INSERT INTO agent_tasks (id, campaign_id, task_type, payload) VALUES (?, ?, ?, ?)'
  ).bind(checkTaskId, reply.campaign_id, 'check_replies', JSON.stringify({ campaign_id: reply.campaign_id })).run();
}
