import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Seeding database...');

  const client = postgres(connectionString);

  try {
    const pricingPlanSeedFile = path.join(__dirname, 'pricing_plan_seed.sql');
    const seedSql = fs.readFileSync(pricingPlanSeedFile, 'utf-8');

    await client.unsafe(seedSql);

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('An error occurred while seeding the database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
