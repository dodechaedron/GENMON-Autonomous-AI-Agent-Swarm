/**
 * Create GENMON tables via Supabase REST API
 * Run: node scripts/create-tables.js
 */
require("dotenv").config();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or key in .env");
  process.exit(1);
}

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

-- Disable RLS so anon key can read/write
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_log ENABLE ROW LEVEL SECURITY;

-- Create policies for full access with anon key
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

async function createTables() {
  console.log("Creating tables via Supabase SQL...");
  
  // Use the Supabase SQL endpoint (requires service_role or use pg directly)
  // Since we might only have anon key, try the /rest/v1/rpc approach
  // But first, let's try the direct SQL endpoint
  const resp = await fetch(`${url}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (!resp.ok) {
    // The RPC approach won't work without a custom function
    // Let's print the SQL for manual execution
    console.log("Cannot execute SQL directly with anon key.");
    console.log("");
    console.log("Please run this SQL manually in Supabase SQL Editor:");
    console.log("URL: https://supabase.com/dashboard/project/jrdbyqhquvdxwwdrrlil/sql/new");
    console.log("");
    console.log("=== COPY BELOW ===");
    console.log(SQL);
    console.log("=== END ===");
  } else {
    console.log("Tables created successfully!");
  }
}

createTables().catch(console.error);
