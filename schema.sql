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
