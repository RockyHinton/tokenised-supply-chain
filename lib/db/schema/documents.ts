import { index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { assets } from "@/lib/db/schema/assets";
import { events } from "@/lib/db/schema/events";
import { users } from "@/lib/db/schema/users";
import { createdAtColumn, idColumn } from "@/lib/db/schema/shared";

export const documents = pgTable(
  "documents",
  {
    id: idColumn(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade", onUpdate: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade", onUpdate: "cascade" }),
    documentType: varchar("document_type", { length: 100 }).notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    storagePath: text("storage_path").notNull(),
    hash: varchar("hash", { length: 255 }).notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade"
    }),
    createdAt: createdAtColumn()
  },
  (table) => ({
    assetIdIdx: index("documents_asset_id_idx").on(table.assetId),
    eventIdIdx: index("documents_event_id_idx").on(table.eventId),
    uploadedByUserIdIdx: index("documents_uploaded_by_user_id_idx").on(table.uploadedByUserId)
  })
);
