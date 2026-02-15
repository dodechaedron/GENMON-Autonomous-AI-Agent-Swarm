/**
 * Create GENMON tables directly via PostgreSQL connection
 * Run: node scripts/create-tables-pg.js
 */
const { Client } = require("pg");

const connectionString =
  "postgresql://postgres.jrdbyqhquvdxwwdrrlil:OgaDwintara094@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const SQL = `
-- Agents table
CREATE TABLE IF NOT EXISTS agents (
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
CREATE TABLE IF NOT EXISTS proposals (
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
CREATE TABLE IF NOT EXISTS breeding_log (
  id SERIAL PRIMARY KEY,
  parent_a TEXT NOT NULL,
  parent_b TEXT NOT NULL,
  child_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and create open policies for anon key access
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON agents FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON proposals FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'breeding_log' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON breeding_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log("Connecting to Supabase PostgreSQL...");
    await client.connect();
    console.log("Connected!");

    console.log("Creating tables...");
    await client.query(SQL);
    console.log("✓ Tables created successfully!");

    // Verify
    const { rows: tables } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('agents', 'proposals', 'breeding_log')"
    );
    console.log("✓ Verified tables:", tables.map((t) => t.tablename).join(", "));

    // Count
    const { rows: [{ count: ac }] } = await client.query("SELECT COUNT(*) as count FROM agents");
    const { rows: [{ count: pc }] } = await client.query("SELECT COUNT(*) as count FROM proposals");
    const { rows: [{ count: bc }] } = await client.query("SELECT COUNT(*) as count FROM breeding_log");
    console.log(`Data: ${ac} agents, ${pc} proposals, ${bc} breeding logs`);
    console.log("");
    console.log("Supabase database ready for GENMON!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

main();
