import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { assets } from "@/lib/db/schema/assets";
import { locations } from "@/lib/db/schema/locations";
import { organisations } from "@/lib/db/schema/organisations";
import { users } from "@/lib/db/schema/users";
import { createdAtColumn, idColumn } from "@/lib/db/schema/shared";

export const events = pgTable(
  "events",
  {
    id: idColumn(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade", onUpdate: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    performedByUserId: uuid("performed_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    performedByOrganisationId: uuid("performed_by_organisation_id").references(
      () => organisations.id,
      {
        onDelete: "set null",
        onUpdate: "cascade"
      }
    ),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    fromStage: varchar("from_stage", { length: 100 }),
    toStage: varchar("to_stage", { length: 100 }),
    fromCustodianOrganisationId: uuid("from_custodian_organisation_id").references(
      () => organisations.id,
      {
        onDelete: "set null",
        onUpdate: "cascade"
      }
    ),
    toCustodianOrganisationId: uuid("to_custodian_organisation_id").references(
      () => organisations.id,
      {
        onDelete: "set null",
        onUpdate: "cascade"
      }
    ),
    notes: text("notes"),
    appTimestamp: timestamp("app_timestamp", { withTimezone: true }).notNull(),
    ledgerRecordId: uuid("ledger_record_id"),
    createdAt: createdAtColumn()
  },
  (table) => ({
    assetIdIdx: index("events_asset_id_idx").on(table.assetId),
    eventTypeIdx: index("events_event_type_idx").on(table.eventType),
    performedByUserIdIdx: index("events_performed_by_user_id_idx").on(table.performedByUserId),
    performedByOrganisationIdIdx: index("events_performed_by_organisation_id_idx").on(
      table.performedByOrganisationId
    ),
    locationIdIdx: index("events_location_id_idx").on(table.locationId),
    ledgerRecordIdIdx: index("events_ledger_record_id_idx").on(table.ledgerRecordId)
  })
);
