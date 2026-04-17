import { pgTable, varchar } from "drizzle-orm/pg-core";

import { createdAtColumn, idColumn, updatedAtColumn } from "@/lib/db/schema/shared";

export const organisations = pgTable("organisations", {
  id: idColumn(),
  name: varchar("name", { length: 256 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn()
});
