/**
 * Setup Supabase tables for GENMON
 * Run: node scripts/setup-supabase.js
 */
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or key in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function setup() {
  console.log("Connecting to Supabase:", url);

  // Test connection first
  const { data: test, error: testErr } = await supabase.from("agents").select("id").limit(1);
  
  if (testErr && testErr.message.includes("does not exist")) {
    console.log("Tables don't exist yet. You need to run the SQL schema manually.");
    console.log("");
    console.log("Steps:");
    console.log("1. Go to https://supabase.com/dashboard/project/jrdbyqhquvdxwwdrrlil/sql");
    console.log("2. Copy the contents of supabase-schema.sql");
    console.log("3. Paste and run in the SQL Editor");
    console.log("");
    console.log("After that, run this script again to verify.");
    return;
  }

  if (testErr) {
    console.error("Connection error:", testErr.message);
    return;
  }

  console.log("✓ Connected! 'agents' table exists.");

  // Check proposals table
  const { error: propErr } = await supabase.from("proposals").select("id").limit(1);
  if (propErr) {
    console.error("✗ 'proposals' table missing:", propErr.message);
  } else {
    console.log("✓ 'proposals' table exists.");
  }

  // Check breeding_log table
  const { error: breedErr } = await supabase.from("breeding_log").select("id").limit(1);
  if (breedErr) {
    console.error("✗ 'breeding_log' table missing:", breedErr.message);
  } else {
    console.log("✓ 'breeding_log' table exists.");
  }

  // Count existing data
  const { count: agentCount } = await supabase.from("agents").select("*", { count: "exact", head: true });
  const { count: propCount } = await supabase.from("proposals").select("*", { count: "exact", head: true });
  const { count: breedCount } = await supabase.from("breeding_log").select("*", { count: "exact", head: true });

  console.log("");
  console.log(`Data: ${agentCount || 0} agents, ${propCount || 0} proposals, ${breedCount || 0} breeding logs`);
  console.log("");
  console.log("Supabase setup complete! GENMON is ready to persist data.");
}

setup().catch(console.error);
