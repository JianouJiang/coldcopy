-- ColdCopy D1 Schema
-- Created: 2026-02-20

-- Sessions table: stores anonymous user sessions with generation quota
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  plan TEXT DEFAULT 'free' NOT NULL,
  generations_used INTEGER DEFAULT 0 NOT NULL,
  max_generations INTEGER DEFAULT 1 NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
);

-- Sequences table: stores generated cold email sequences (input + output)
CREATE TABLE IF NOT EXISTS sequences (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  input JSON NOT NULL,
  output JSON NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Create index on sessions for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);

-- Create index on sequences for faster lookups by session_id
CREATE INDEX IF NOT EXISTS idx_sequences_session_id ON sequences(session_id);

-- ============================================
-- Agent Mode Tables
-- Added: 2026-02-22
-- ============================================

-- User accounts for Agent Mode
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  company_intro TEXT,
  plan TEXT DEFAULT 'free',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Gmail OAuth connections (1:1 with user)
CREATE TABLE IF NOT EXISTS gmail_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  gmail_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  company_intro TEXT NOT NULL,
  icp_description TEXT NOT NULL,
  email_rules TEXT,
  tone TEXT DEFAULT 'professional',
  max_emails_per_day INTEGER DEFAULT 20,
  sender_name TEXT DEFAULT '',
  sender_title TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  leads_found INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Leads discovered by agent
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  company_name TEXT NOT NULL,
  company_url TEXT,
  company_description TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_title TEXT,
  research_data TEXT,
  source TEXT DEFAULT 'web_search',
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Outbound emails
CREATE TABLE IF NOT EXISTS outbound_emails (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  sent_at TEXT,
  error TEXT,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Outbound email thread tracking (added for reply reading)
-- gmail_thread_id is added to outbound_emails via ALTER TABLE below

-- Email replies received from leads
CREATE TABLE IF NOT EXISTS email_replies (
  id TEXT PRIMARY KEY,
  outbound_email_id TEXT NOT NULL REFERENCES outbound_emails(id),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  lead_id TEXT NOT NULL REFERENCES leads(id),
  gmail_message_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  body_html TEXT,
  received_at TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  ai_summary TEXT,
  ai_sentiment TEXT,
  ai_suggested_reply TEXT,
  ai_reply_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_replies_outbound ON email_replies(outbound_email_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_campaign ON email_replies(campaign_id);

-- Agent task queue
CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  task_type TEXT NOT NULL,
  payload TEXT,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Email bounces (blocklist)
CREATE TABLE IF NOT EXISTS email_bounces (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email_address TEXT NOT NULL,
  bounce_type TEXT DEFAULT 'hard',
  reason TEXT,
  source_campaign_id TEXT REFERENCES campaigns(id),
  source_outbound_email_id TEXT REFERENCES outbound_emails(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_bounces_user_email ON email_bounces(user_id, email_address);

-- Agent Mode indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outbound_emails_campaign_id ON outbound_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outbound_emails_lead_id ON outbound_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_campaign_id ON agent_tasks(campaign_id);
