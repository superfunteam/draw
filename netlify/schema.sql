-- Netlify DB Schema for Superfun Draw User Authentication
-- This file defines the database schema for storing user tokens and auth codes

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  tokens INTEGER NOT NULL DEFAULT 0,  -- Now stores balance in cents (e.g., 1000 = $10.00)
  auth_code TEXT UNIQUE,
  auth_code_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick auth code lookups
CREATE INDEX IF NOT EXISTS idx_auth_code ON users(auth_code) WHERE auth_code_used = FALSE;

-- Index for token lookups by email
CREATE INDEX IF NOT EXISTS idx_email ON users(email);