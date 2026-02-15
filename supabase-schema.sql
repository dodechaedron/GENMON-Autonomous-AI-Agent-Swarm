-- GENMON Supabase Schema
-- Run this in your Supabase SQL Editor to create the tables

-- Agents table
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SCOUT', 'ANALYST', 'LAUNCHER')),
  dna JSONB NOT NULL DEFAULT '{}',
  generation INTEGER NOT NULL DEFAULT 0,
  alive BOOLEAN NOT NULL DEFAULT true,
  success_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'idle',
  thoughts TEXT[] NOT NULL DEFAULT '{}',
  position FLOAT8[] NOT NULL DEFAULT '{0,0,0}',
  color TEXT NOT NULL DEFAULT '#00FFFF',
  parent_ids TEXT[],
  total_pnl FLOAT8 NOT NULL DEFAULT 0,
  launch_count INTEGER NOT NULL DEFAULT 0,
  best_launch_pnl FLOAT8 NOT NULL DEFAULT 0,
  birth_time BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Proposals table
CREATE TABLE proposals (
  id TEXT PRIMARY KEY,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  concept TEXT NOT NULL DEFAULT '',
  confidence FLOAT8 NOT NULL DEFAULT 0,
  votes JSONB NOT NULL DEFAULT '{"scout":null,"analyst":null,"launcher":null}',
  executed BOOLEAN NOT NULL DEFAULT false,
  successful BOOLEAN,
  timestamp BIGINT NOT NULL DEFAULT 0,
  token_address TEXT,
  launch_price FLOAT8,
  current_price FLOAT8,
  price_change FLOAT8,
  volume_24h FLOAT8,
  last_checked BIGINT,
  mode TEXT CHECK (mode IN ('onchain', 'simulation')),
  scout_id TEXT,
  analyst_id TEXT,
  launcher_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Breeding log table
CREATE TABLE breeding_log (
  id SERIAL PRIMARY KEY,
  parent_a TEXT NOT NULL,
  parent_b TEXT NOT NULL,
  child_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
