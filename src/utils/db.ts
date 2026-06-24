import { neon } from "@neondatabase/serverless";

function getConnectionString(): string {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("DATABASE_URL is required. Set it in your .env.local");
  return cs;
}

function getSql() {
  return neon(getConnectionString());
}

/**
 * Execute a SQL query with parameterized values.
 * Wraps neon's tagged template function for string-based usage.
 */
function buildQuery(queryStr: string, params: any[]) {
  return (getSql() as any)(queryStr, params);
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
