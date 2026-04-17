import { index, integer, jsonb, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { events } from "@/lib/db/schema/events";
import { createdAtColumn, idColumn } from "@/lib/db/schema/shared";
import { HcsEventPayload } from "@/lib/types";

export const ledgerRecords = pgTable(
  "ledger_records",
  {
    id: idColumn(),
    eventId: varchar("event_id", { length: 64 })
      .notNull()
      .references(() => events.id, { onDelete: "cascade", onUpdate: "cascade" }),
    status: varchar("status", { length: 100 }).notNull(),
    network: varchar("network", { length: 100 }).notNull(),
    topicId: varchar("topic_id", { length: 100 }),
    sequenceNumber: integer("sequence_number"),
    consensusTimestamp: varchar("consensus_timestamp", { length: 100 }),
    messageHash: varchar("message_hash", { length: 255 }),
    submittedPayload: jsonb("submitted_payload").$type<HcsEventPayload>().notNull(),
    createdAt: createdAtColumn()
  },
  (table) => ({
    eventIdIdx: uniqueIndex("ledger_records_event_id_idx").on(table.eventId),
    statusIdx: index("ledger_records_status_idx").on(table.status)
  })
);
