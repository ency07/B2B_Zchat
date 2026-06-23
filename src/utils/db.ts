import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Set it in your .env.local");
}

const sql = neon(connectionString);

/**
 * Execute a SQL query with parameterized values.
 * Wraps neon's tagged template function for string-based usage.
 */
function buildQuery(queryStr: string, params: any[]) {
  // Convert $1, $2... style params to neon's query+array format
  // neon v2's raw function signature accepts (string, params[])
  return (sql as any)(queryStr, params);
}

/**
 * Execute a query and return all rows.
 */
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
  return buildQuery(queryString, params) as Promise<T[]>;
}

/**
 * Execute a query and return a single row or null.
 */
export async function queryOne<T = any>(queryString: string, ...params: any[]): Promise<T | null> {
  const rows = await buildQuery(queryString, params);
  return ((rows as T[])?.[0] || null) as T | null;
}

/**
 * Execute a query (INSERT, UPDATE, DELETE).
 */
export async function execute<T = any>(queryString: string, ...params: any[]): Promise<T[]> {
  return buildQuery(queryString, params) as Promise<T[]>;
}

export default sql;
