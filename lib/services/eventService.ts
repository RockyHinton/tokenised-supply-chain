import { storeRepository } from "@/lib/repositories/storeRepository";
import { EventRecord } from "@/lib/types";
import { validateLifecycleTransition } from "@/lib/validation/lifecycleRules";
import { CreateEventInput, createEventSchema } from "@/lib/validation/schemas";
import { nowIso } from "@/lib/utils/dates";
import { ledgerService } from "@/lib/services/ledgerService";

export class EventService {
  async listEvents(): Promise<EventRecord[]> {
    const store = await storeRepository.getStore();
    return [...store.events].sort((a, b) => b.appTimestamp.localeCompare(a.appTimestamp));
  }

  async getEventById(id: string): Promise<EventRecord | null> {
    const store = await storeRepository.getStore();
    return store.events.find((event) => event.id === id) ?? null;
  }

  async recordEvent(input: CreateEventInput): Promise<EventRecord> {
    const parsed = createEventSchema.parse(input);
    const store = await storeRepository.getStore();
    const asset = store.assets.find((item) => item.id === parsed.assetId);

    if (!asset) {
      throw new Error("Asset not found.");
    }

    if (asset.currentStage !== parsed.fromStage) {
      throw new Error(
        `Asset is currently at stage ${asset.currentStage}, not ${parsed.fromStage ?? "null"}.`
      );
    }

    if ((asset.currentCustodian || null) !== parsed.fromCustodian) {
      throw new Error("Previous custodian does not match the asset's current custodian.");
    }

    validateLifecycleTransition({
      eventType: parsed.eventType,
      fromStage: parsed.fromStage,
      toStage: parsed.toStage
    });

    const timestamp = nowIso();
    const eventId = storeRepository.nextId(store, "event");
    const documents = [];

    if (parsed.documentHash) {
      documents.push({
        id: storeRepository.nextId(store, "document"),
        assetId: asset.id,
        eventId,
        filename: parsed.documentFilename || `${parsed.eventType}-document.txt`,
        documentType: parsed.documentType || "supporting_document",
        hash: parsed.documentHash,
        createdAt: timestamp
      });
    }

    const payload = ledgerService.prepareSubmission({
      asset,
      event: {
        id: eventId,
        assetId: asset.id,
        eventType: parsed.eventType,
        actorId: parsed.actorId,
        actorRole: parsed.actorRole,
        fromStage: parsed.fromStage,
        toStage: parsed.toStage,
        fromCustodian: parsed.fromCustodian,
        toCustodian: parsed.toCustodian,
        locationName: parsed.locationName || null,
        notes: parsed.notes || null,
        documentHash: parsed.documentHash || null,
        appTimestamp: timestamp
      },
      documents
    });

    const ledgerRecord = await ledgerService.createSubmissionRecord(payload, store);
    store.ledgerRecords.push(ledgerRecord);
    const event: EventRecord = {
      id: eventId,
      assetId: asset.id,
      eventType: parsed.eventType,
      actorId: parsed.actorId,
      actorRole: parsed.actorRole,
      fromStage: parsed.fromStage,
      toStage: parsed.toStage,
      fromCustodian: parsed.fromCustodian,
      toCustodian: parsed.toCustodian,
      locationName: parsed.locationName || null,
      notes: parsed.notes || null,
      documentHash: parsed.documentHash || null,
      appTimestamp: timestamp,
      ledgerRecordId: ledgerRecord.ledgerRecordId
    };

    asset.currentStage = parsed.toStage;
    asset.currentCustodian = parsed.toCustodian || asset.currentCustodian;
    asset.updatedAt = timestamp;

    store.events.push(event);
    if (documents.length > 0) {
      store.documents.push(...documents);
    }

    const assetIndex = store.assets.findIndex((item) => item.id === asset.id);
    store.assets[assetIndex] = asset;
    await storeRepository.saveStore(store);

    return event;
  }
}

export const eventService = new EventService();
