import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

let _db: ReturnType<typeof createDb> | undefined;

/** Lazy proxy — safe for imports at build time (no DATABASE_URL needed) */
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_, prop) {
    if (!_db) _db = createDb();
    return (_db as any)[prop];
  },
});

/** Returns the real Drizzle instance (needed by Auth.js adapter which checks prototype chain) */
export function getRealDb() {
  if (!_db) _db = createDb();
  return _db;
}
