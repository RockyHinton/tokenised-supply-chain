import { index, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { organisations } from "@/lib/db/schema/organisations";
import { createdAtColumn, idColumn, updatedAtColumn } from "@/lib/db/schema/shared";

export const locations = pgTable(
  "locations",
  {
    id: idColumn(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "restrict", onUpdate: "cascade" }),
    name: varchar("name", { length: 256 }).notNull(),
    code: varchar("code", { length: 100 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => ({
    organisationIdIdx: index("locations_organisation_id_idx").on(table.organisationId),
    organisationCodeIdx: uniqueIndex("locations_organisation_code_idx").on(
      table.organisationId,
      table.code
    )
  })
);
