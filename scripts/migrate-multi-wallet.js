/**
 * Migration: Add owner_wallet column for multi-wallet support
 * Run: node scripts/migrate-multi-wallet.js
 */
require("dotenv").config();
const { Client } = require("pg");

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/postgres";

const SQL = `
-- Add owner_wallet to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_wallet TEXT;
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_wallet);

-- Add owner_wallet to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS owner_wallet TEXT;
CREATE INDEX IF NOT EXISTS idx_proposals_owner ON proposals(owner_wallet);

-- Add owner_wallet to breeding_log
ALTER TABLE breeding_log ADD COLUMN IF NOT EXISTS owner_wallet TEXT;
CREATE INDEX IF NOT EXISTS idx_breeding_owner ON breeding_log(owner_wallet);
`;

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    console.log("Running multi-wallet migration...");
    await client.connect();
    await client.query(SQL);
    console.log("✓ Migration complete — owner_wallet columns added.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

main();
