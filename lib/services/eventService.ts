import { type DbClient } from "@/lib/db/client";
import { assetRepository } from "@/lib/repositories/assetRepository";
import { documentRepository } from "@/lib/repositories/documentRepository";
import { eventRepository } from "@/lib/repositories/eventRepository";
import { idRepository } from "@/lib/repositories/idRepository";
import { ledgerRecordRepository } from "@/lib/repositories/ledgerRecordRepository";
import { locationRepository } from "@/lib/repositories/locationRepository";
import { organisationRepository } from "@/lib/repositories/organisationRepository";
import { userRepository } from "@/lib/repositories/userRepository";
import { EventRecord } from "@/lib/types";
import { validateLifecycleTransition } from "@/lib/validation/lifecycleRules";
import { CreateEventInput, createEventSchema } from "@/lib/validation/schemas";
import { nowIso } from "@/lib/utils/dates";
import { ledgerService } from "@/lib/services/ledgerService";

type DbExecutor = DbClient;

export class EventService {
  async listEvents(): Promise<EventRecord[]> {
    return eventRepository.list();
  }

  async getEventById(id: string): Promise<EventRecord | null> {
    return eventRepository.getById(id);
  }

  async recordEvent(input: CreateEventInput): Promise<EventRecord> {
    return ledgerService.withTransaction((tx) => this.recordEventWithExecutor(input, tx));
  }

  async recordEventWithExecutor(input: CreateEventInput, executor: DbExecutor): Promise<EventRecord> {
    const parsed = createEventSchema.parse(input);
    const asset = await assetRepository.getById(parsed.assetId, executor);

    if (!asset) {
      throw new Error("Asset not found.");
    }

    const existingEvents = await eventRepository.listByAssetId(parsed.assetId, executor);
    const isInitialBatchCreation =
      existingEvents.length === 0 &&
      parsed.eventType === "batch_created" &&
      parsed.fromStage === null &&
      parsed.fromCustodian === null;

    if (!isInitialBatchCreation && asset.currentStage !== parsed.fromStage) {
      throw new Error(
        `Asset is currently at stage ${asset.currentStage}, not ${parsed.fromStage ?? "null"}.`
      );
    }

    if (!isInitialBatchCreation && (asset.currentCustodian || null) !== parsed.fromCustodian) {
      throw new Error("Previous custodian does not match the asset's current custodian.");
    }

    validateLifecycleTransition({
      eventType: parsed.eventType,
      fromStage: parsed.fromStage,
      toStage: parsed.toStage
    });

    const actor = await userRepository.getById(parsed.actorId, executor);

    if (!actor) {
      throw new Error("Selected actor is not available in the database.");
    }

    const nextCustodian = parsed.toCustodian || asset.currentCustodian;
    const nextCustodianOrganisation = await organisationRepository.getById(nextCustodian, executor);

    if (!nextCustodianOrganisation) {
      throw new Error("Selected custodian is not available in the database.");
    }

    const location = parsed.locationId
      ? await locationRepository.getById(parsed.locationId, executor)
      : null;

    if (parsed.locationId && !location) {
      throw new Error("Selected location is not available in the database.");
    }

    const timestamp = nowIso();
    const eventId = await idRepository.nextEventId(executor);
    const ledgerRecordId = await idRepository.nextLedgerRecordId(executor);
    const sequenceNumber = await idRepository.nextLedgerSequence(executor);

    const documents = parsed.documentHash
      ? [
          {
            id: await idRepository.nextDocumentId(executor),
            assetId: asset.id,
            eventId,
            filename: parsed.documentFilename || `${parsed.eventType}-document.txt`,
            documentType: parsed.documentType || "supporting_document",
            hash: parsed.documentHash,
            createdAt: timestamp
          }
        ]
      : [];

    const payload = ledgerService.prepareSubmission({
      asset,
      event: {
        id: eventId,
        assetId: asset.id,
        eventType: parsed.eventType,
        actorId: parsed.actorId,
        actorRole: actor.role,
        fromStage: parsed.fromStage,
        toStage: parsed.toStage,
        fromCustodian: parsed.fromCustodian,
        toCustodian: parsed.toCustodian,
        locationName: location?.name ?? parsed.locationName ?? null,
        notes: parsed.notes || null,
        documentHash: parsed.documentHash || null,
        appTimestamp: timestamp
      },
      documents
    });

    const event: EventRecord = {
      id: eventId,
      assetId: asset.id,
      eventType: parsed.eventType,
      actorId: parsed.actorId,
      actorRole: actor.role,
      fromStage: parsed.fromStage,
      toStage: parsed.toStage,
      fromCustodian: parsed.fromCustodian,
      toCustodian: parsed.toCustodian,
      locationName: location?.name ?? parsed.locationName ?? null,
      notes: parsed.notes || null,
      documentHash: parsed.documentHash || null,
      appTimestamp: timestamp,
      ledgerRecordId
    };

    await eventRepository.create(
      {
        ...event,
        ledgerRecordId,
        performedByUserId: parsed.actorId,
        performedByOrganisationId: actor.organisationId,
        locationId: location?.id ?? null
      },
      executor
    );

    for (const document of documents) {
      await documentRepository.create(
        {
          ...document,
          uploadedByUserId: parsed.actorId
        },
        executor
      );
    }

    const ledgerRecord = await ledgerService.createSubmissionRecord(payload, {
      executor,
      ledgerRecordId,
      sequenceNumber
    });

    if (ledgerRecord.ledgerRecordId !== ledgerRecordId) {
      throw new Error("Ledger record ID generation drift detected.");
    }

    await assetRepository.update(
      {
        ...asset,
        currentStage: parsed.toStage,
        currentCustodian: nextCustodian,
        currentCustodianOrganisationId: nextCustodian,
        updatedAt: timestamp
      },
      executor
    );

    await ledgerRecordRepository.create(
      {
        ...ledgerRecord,
        eventId: event.id,
        createdAt: ledgerRecord.consensusTimestamp
      },
      executor
    );

    return event;
  }
}

export const eventService = new EventService();
