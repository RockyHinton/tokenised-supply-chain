import { index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { organisations } from "@/lib/db/schema/organisations";
import { createdAtColumn, idColumn, updatedAtColumn } from "@/lib/db/schema/shared";

export const assets = pgTable(
  "assets",
  {
    id: idColumn(),
    externalAssetId: varchar("external_asset_id", { length: 128 }).notNull(),
    assetType: varchar("asset_type", { length: 100 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    batchNumber: varchar("batch_number", { length: 128 }),
    originOrganisationId: uuid("origin_organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "restrict", onUpdate: "cascade" }),
    currentStage: varchar("current_stage", { length: 100 }).notNull(),
    currentCustodianOrganisationId: uuid("current_custodian_organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "restrict", onUpdate: "cascade" }),
    status: varchar("status", { length: 100 }).notNull(),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn()
  },
  (table) => ({
    externalAssetIdIdx: uniqueIndex("assets_external_asset_id_idx").on(table.externalAssetId),
    originOrganisationIdIdx: index("assets_origin_organisation_id_idx").on(
      table.originOrganisationId
    ),
    currentCustodianOrganisationIdIdx: index("assets_current_custodian_organisation_id_idx").on(
      table.currentCustodianOrganisationId
    )
  })
);
