/**
 * apply-patch.ts
 * Aplica UN archivo de migración SQL de forma incremental (sin DROP SCHEMA).
 * Uso: npx ts-node scripts/apply-patch.ts <nombre-del-archivo.sql>
 */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [,, fileName] = process.argv;
  if (!fileName) {
    console.error('Uso: npx ts-node scripts/apply-patch.ts <nombre-del-archivo.sql>');
    process.exit(1);
  }

  const sqlPath = path.isAbsolute(fileName)
    ? fileName
    : path.join(__dirname, '../supabase/migrations', fileName);

  if (!fs.existsSync(sqlPath)) {
    console.error(`Error: No se encontró el archivo: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log(`\n🔄  Aplicando parche: ${path.basename(sqlPath)} (${sql.length} bytes)\n`);

  const client = new Client({
    host: 'aws-1-us-west-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.jcsjfvrfsohahnoovjgf',
    password: 'UuTt7pdS5O75mbR6',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅  Conexión establecida.');

    await client.query(sql);
    console.log('✅  Parche aplicado exitosamente.');
  } catch (err: any) {
    console.error('❌  Error al aplicar el parche:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
