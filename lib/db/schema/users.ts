import { boolean, index, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { organisations } from "@/lib/db/schema/organisations";
import { createdAtColumn, idColumn, updatedAtColumn } from "@/lib/db/schema/shared";

export const users = pgTable(
  "users",
  {
    id: idColumn(),
    organisationId: varchar("organisation_id", { length: 64 })
      .notNull()
      .references(() => organisations.id, { onDelete: "restrict", onUpdate: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    role: varchar("role", { length: 100 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => ({
    organisationIdIdx: index("users_organisation_id_idx").on(table.organisationId),
    emailIdx: uniqueIndex("users_email_idx").on(table.email)
  })
);
