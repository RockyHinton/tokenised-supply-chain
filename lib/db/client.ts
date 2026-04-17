import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/db/env";
import * as schema from "@/lib/db/schema";

declare global {
  var __tokenisedSupplyChainPool: Pool | undefined;
}

const pool =
  globalThis.__tokenisedSupplyChainPool ??
  new Pool({
    connectionString: env.DATABASE_URL
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__tokenisedSupplyChainPool = pool;
}

export const db = drizzle(pool, { schema });
export type DbClient = typeof db;
