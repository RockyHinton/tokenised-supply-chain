import { relations } from "drizzle-orm";

import { assets } from "@/lib/db/schema/assets";
import { documents } from "@/lib/db/schema/documents";
import { events } from "@/lib/db/schema/events";
import { ledgerRecords } from "@/lib/db/schema/ledgerRecords";
import { locations } from "@/lib/db/schema/locations";
import { organisations } from "@/lib/db/schema/organisations";
import { users } from "@/lib/db/schema/users";

export { assets } from "@/lib/db/schema/assets";
export { documents } from "@/lib/db/schema/documents";
export { events } from "@/lib/db/schema/events";
export { ledgerRecords } from "@/lib/db/schema/ledgerRecords";
export { locations } from "@/lib/db/schema/locations";
export { organisations } from "@/lib/db/schema/organisations";
export { users } from "@/lib/db/schema/users";

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  locations: many(locations),
  originatedAssets: many(assets, {
    relationName: "asset_origin_organisation"
  }),
  custodiedAssets: many(assets, {
    relationName: "asset_custodian_organisation"
  }),
  performedEvents: many(events, {
    relationName: "event_performed_by_organisation"
  }),
  fromCustodyEvents: many(events, {
    relationName: "event_from_custodian_organisation"
  }),
  toCustodyEvents: many(events, {
    relationName: "event_to_custodian_organisation"
  })
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id]
  }),
  performedEvents: many(events),
  uploadedDocuments: many(documents)
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [locations.organisationId],
    references: [organisations.id]
  }),
  events: many(events)
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  originOrganisation: one(organisations, {
    fields: [assets.originOrganisationId],
    references: [organisations.id],
    relationName: "asset_origin_organisation"
  }),
  currentCustodianOrganisation: one(organisations, {
    fields: [assets.currentCustodianOrganisationId],
    references: [organisations.id],
    relationName: "asset_custodian_organisation"
  }),
  events: many(events),
  documents: many(documents)
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  asset: one(assets, {
    fields: [events.assetId],
    references: [assets.id]
  }),
  performedByUser: one(users, {
    fields: [events.performedByUserId],
    references: [users.id]
  }),
  performedByOrganisation: one(organisations, {
    fields: [events.performedByOrganisationId],
    references: [organisations.id],
    relationName: "event_performed_by_organisation"
  }),
  location: one(locations, {
    fields: [events.locationId],
    references: [locations.id]
  }),
  fromCustodianOrganisation: one(organisations, {
    fields: [events.fromCustodianOrganisationId],
    references: [organisations.id],
    relationName: "event_from_custodian_organisation"
  }),
  toCustodianOrganisation: one(organisations, {
    fields: [events.toCustodianOrganisationId],
    references: [organisations.id],
    relationName: "event_to_custodian_organisation"
  }),
  documents: many(documents),
  ledgerRecord: one(ledgerRecords, {
    fields: [events.ledgerRecordId],
    references: [ledgerRecords.id]
  })
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  asset: one(assets, {
    fields: [documents.assetId],
    references: [assets.id]
  }),
  event: one(events, {
    fields: [documents.eventId],
    references: [events.id]
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedByUserId],
    references: [users.id]
  })
}));

export const ledgerRecordsRelations = relations(ledgerRecords, ({ one }) => ({
  event: one(events, {
    fields: [ledgerRecords.eventId],
    references: [events.id]
  })
}));

export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type LedgerRecord = typeof ledgerRecords.$inferSelect;
export type NewLedgerRecord = typeof ledgerRecords.$inferInsert;
