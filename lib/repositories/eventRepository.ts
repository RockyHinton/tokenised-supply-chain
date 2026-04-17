import { eq, desc, asc, inArray } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { ensureDatabaseSeeded } from "@/lib/db/seedRuntime";
import { documents, events, locations, users } from "@/lib/db/schema";
import { mapEventRowToDomain } from "@/lib/repositories/mappers";
import { EventRecord } from "@/lib/types";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

export class EventRepository {
  async list(executor?: DbExecutor): Promise<EventRecord[]> {
    await ensureDatabaseSeeded(executor);

    const rows = await resolveExecutor(executor)
      .select({
        id: events.id,
        assetId: events.assetId,
        eventType: events.eventType,
        performedByUserId: events.performedByUserId,
        fromStage: events.fromStage,
        toStage: events.toStage,
        fromCustodianOrganisationId: events.fromCustodianOrganisationId,
        toCustodianOrganisationId: events.toCustodianOrganisationId,
        notes: events.notes,
        appTimestamp: events.appTimestamp,
        ledgerRecordId: events.ledgerRecordId,
        actorRole: users.role,
        locationName: locations.name
      })
      .from(events)
      .leftJoin(users, eq(events.performedByUserId, users.id))
      .leftJoin(locations, eq(events.locationId, locations.id))
      .orderBy(desc(events.appTimestamp));

    const hashesByEventId = await this.getDocumentHashesByEventIds(
      rows.map((row) => row.id),
      executor
    );

    return rows.map((row) =>
      mapEventRowToDomain({
        ...row,
        documentHash: hashesByEventId.get(row.id) ?? null
      })
    );
  }

  async getById(id: string, executor?: DbExecutor): Promise<EventRecord | null> {
    const eventsList = await this.list(executor);
    return eventsList.find((event) => event.id === id) ?? null;
  }

  async listByAssetId(assetId: string, executor?: DbExecutor): Promise<EventRecord[]> {
    await ensureDatabaseSeeded(executor);

    const rows = await resolveExecutor(executor)
      .select({
        id: events.id,
        assetId: events.assetId,
        eventType: events.eventType,
        performedByUserId: events.performedByUserId,
        fromStage: events.fromStage,
        toStage: events.toStage,
        fromCustodianOrganisationId: events.fromCustodianOrganisationId,
        toCustodianOrganisationId: events.toCustodianOrganisationId,
        notes: events.notes,
        appTimestamp: events.appTimestamp,
        ledgerRecordId: events.ledgerRecordId,
        actorRole: users.role,
        locationName: locations.name
      })
      .from(events)
      .leftJoin(users, eq(events.performedByUserId, users.id))
      .leftJoin(locations, eq(events.locationId, locations.id))
      .where(eq(events.assetId, assetId))
      .orderBy(asc(events.appTimestamp));

    const hashesByEventId = await this.getDocumentHashesByEventIds(
      rows.map((row) => row.id),
      executor
    );

    return rows.map((row) =>
      mapEventRowToDomain({
        ...row,
        documentHash: hashesByEventId.get(row.id) ?? null
      })
    );
  }

  async create(
    event: EventRecord & {
      performedByUserId?: string | null;
      performedByOrganisationId?: string | null;
      locationId?: string | null;
    },
    executor?: DbExecutor
  ): Promise<EventRecord> {
    await ensureDatabaseSeeded(executor);

    await resolveExecutor(executor).insert(events).values({
      id: event.id,
      assetId: event.assetId,
      eventType: event.eventType,
      performedByUserId: event.performedByUserId ?? event.actorId,
      performedByOrganisationId: event.performedByOrganisationId ?? null,
      locationId: event.locationId ?? null,
      fromStage: event.fromStage,
      toStage: event.toStage,
      fromCustodianOrganisationId: event.fromCustodian,
      toCustodianOrganisationId: event.toCustodian,
      notes: event.notes,
      appTimestamp: event.appTimestamp,
      ledgerRecordId: event.ledgerRecordId,
      createdAt: event.appTimestamp
    });

    return event;
  }

  private async getDocumentHashesByEventIds(eventIds: string[], executor?: DbExecutor) {
    if (eventIds.length === 0) {
      return new Map<string, string>();
    }

    const rows = await resolveExecutor(executor)
      .select({
        eventId: documents.eventId,
        hash: documents.hash
      })
      .from(documents)
      .where(inArray(documents.eventId, [...new Set(eventIds)]));

    return new Map(rows.map((row) => [row.eventId, row.hash]));
  }
}

export const eventRepository = new EventRepository();
