import { Client } from 'pg';

async function main() {
  const client = new Client({
    host: 'aws-1-us-west-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.jcsjfvrfsohahnoovjgf',
    password: 'UuTt7pdS5O75mbR6',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('¡Conectado!');

    const res1 = await client.query("SELECT current_user, session_user;");
    console.log('Users:', res1.rows);

    await client.end();
  } catch (err: any) {
    console.error('Error:', err);
  }
}

main();
