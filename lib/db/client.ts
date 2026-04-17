import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/lib/db/env";
import * as schema from "@/lib/db/schema";

declare global {
  var __tokenisedSupplyChainPool: Pool | undefined;
  var __tokenisedSupplyChainDb:
    | ReturnType<typeof drizzle<typeof schema>>
    | undefined;
}

function getPool() {
  const existingPool = globalThis.__tokenisedSupplyChainPool;

  if (existingPool) {
    return existingPool;
  }

  const pool = new Pool({
    connectionString: getEnv().DATABASE_URL
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__tokenisedSupplyChainPool = pool;
  }

  return pool;
}

export function getDb() {
  const existingDb = globalThis.__tokenisedSupplyChainDb;

  if (existingDb) {
    return existingDb;
  }

  const db = drizzle(getPool(), { schema });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__tokenisedSupplyChainDb = db;
  }

  return db;
}

export type DbClient = ReturnType<typeof getDb>;
