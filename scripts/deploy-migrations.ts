import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Iniciando deploy de migraciones en la base de datos Supabase...');
  const sqlPath = path.join(__dirname, '../supabase_combined_migrations.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`Error: No se encontró el archivo consolidado en ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`Cargado archivo SQL consolidado (${sql.length} bytes).`);

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
    console.log('Conexión establecida con la base de datos.');

    console.log('Reiniciando el esquema público (DROP & CREATE SCHEMA)...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;');
    console.log('Esquema público reiniciado exitosamente.');

    console.log('Ejecutando script de migración consolidado... (esto puede tardar unos segundos)');
    await client.query(sql);
    console.log('¡Migraciones y datos semilla aplicados exitosamente!');

    console.log('Restaurando permisos de los roles de Supabase API (anon, authenticated, service_role)...');
    const grantQuery = `
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL ON SCHEMA public TO postgres, service_role;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
    `;
    await client.query(grantQuery);
    console.log('¡Permisos y privilegios de Supabase restaurados exitosamente en Supabase!');
  } catch (error) {
    console.error('Error al aplicar las migraciones:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
