import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

async function setupRLS() {
  const connectionString = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'flowtest'}`;

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  console.log('Connecting to database...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    // Read the SQL file
    const sqlFile = readFileSync(join(__dirname, 'rls-setup.sql'), 'utf-8');
    
    // Replace the JWT_SECRET placeholder with the actual value from .env
    const sqlWithSecret = sqlFile.replace(/'JWT_SECRET'/g, `'${jwtSecret.replace(/'/g, "''")}'`);

    console.log('Setting up RLS policies...');
    
    // Split by semicolons and execute each statement
    const statements = sqlWithSecret
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
        } catch (err: any) {
          // Ignore errors for ALTER DATABASE if it fails (permission issues)
          if (err.message?.includes('ALTER DATABASE') && err.message?.includes('permission')) {
            console.log('Skipping ALTER DATABASE (permission denied - this is optional)');
            continue;
          }
          // Ignore "already exists" errors
          if (err.message?.includes('already exists')) {
            console.log('Policy/function already exists, skipping...');
            continue;
          }
          throw err;
        }
      }
    }

    console.log('RLS setup completed successfully!');
  } catch (err: any) {
    console.error('RLS setup failed:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupRLS();

