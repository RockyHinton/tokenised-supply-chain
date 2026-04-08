import {
  EventWorkflowAssetOption,
  analyzeAssetAudit,
  buildEventWorkflowDefaults
} from "@/lib/domain/assetAudit";
import { storeRepository } from "@/lib/repositories/storeRepository";
import { Asset, AssetWithRelations, DashboardSummary, EventRecord, STAGES } from "@/lib/types";
import { getNextAllowedEvent } from "@/lib/validation/lifecycleRules";
import { CreateAssetInput, createAssetSchema } from "@/lib/validation/schemas";
import { nowIso } from "@/lib/utils/dates";
import { eventService } from "@/lib/services/eventService";

export class AssetService {
  async listAssets(): Promise<Array<Asset & { lastEventDate: string | null }>> {
    const store = await storeRepository.getStore();

    return [...store.assets]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((asset) => {
        const lastEvent = store.events
          .filter((event) => event.assetId === asset.id)
          .sort((a, b) => b.appTimestamp.localeCompare(a.appTimestamp))[0];

        return {
          ...asset,
          lastEventDate: lastEvent?.appTimestamp ?? null
        };
      });
  }

  async getAssetById(assetId: string): Promise<AssetWithRelations | null> {
    const store = await storeRepository.getStore();
    const asset = store.assets.find((item) => item.id === assetId) ?? null;

    if (!asset) {
      return null;
    }

    const events = store.events
      .filter((event) => event.assetId === asset.id)
      .sort((a, b) => a.appTimestamp.localeCompare(b.appTimestamp));
    const documents = store.documents
      .filter((document) => document.assetId === asset.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latestLedgerRecord = [...store.ledgerRecords]
      .filter((record) => record.submittedPayload.assetId === asset.id)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber)[0] ?? null;

    return {
      ...asset,
      events,
      documents,
      latestLedgerRecord
    };
  }

  async getAssetDetailView(assetId: string) {
    const store = await storeRepository.getStore();
    const asset = store.assets.find((item) => item.id === assetId) ?? null;

    if (!asset) {
      return null;
    }

    const events = store.events
      .filter((event) => event.assetId === asset.id)
      .sort((a, b) => a.appTimestamp.localeCompare(b.appTimestamp));
    const documents = store.documents
      .filter((document) => document.assetId === asset.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ledgerRecords = store.ledgerRecords
      .filter((record) => record.submittedPayload.assetId === asset.id)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber);

    return {
      asset: {
        ...asset,
        events,
        documents,
        latestLedgerRecord: ledgerRecords[0] ?? null
      },
      audit: analyzeAssetAudit({
        asset,
        events,
        documents,
        ledgerRecords
      })
    };
  }

  async listAssetsForEventFlow(): Promise<EventWorkflowAssetOption[]> {
    const store = await storeRepository.getStore();

    return store.assets
      .map((asset) => {
        const events = store.events
          .filter((event) => event.assetId === asset.id)
          .sort((a, b) => a.appTimestamp.localeCompare(b.appTimestamp));
        const documents = store.documents.filter((document) => document.assetId === asset.id);
        const ledgerRecords = store.ledgerRecords.filter(
          (record) => record.submittedPayload.assetId === asset.id
        );
        const analysis = analyzeAssetAudit({
          asset,
          events,
          documents,
          ledgerRecords
        });

        return {
          asset,
          workflow: buildEventWorkflowDefaults({
            asset,
            analysis
          }),
          audit: analysis
        };
      })
      .sort((a, b) => b.asset.updatedAt.localeCompare(a.asset.updatedAt));
  }

  async createAsset(input: CreateAssetInput): Promise<{
    asset: Asset;
    initialEvent: EventRecord;
  }> {
    const parsed = createAssetSchema.parse(input);
    const timestamp = nowIso();
    const store = await storeRepository.getStore();

    const asset: Asset = {
      id: storeRepository.nextId(store, "asset"),
      assetId: parsed.assetId,
      assetType: parsed.assetType,
      name: parsed.name,
      description: parsed.description,
      originSupplier: parsed.originSupplier,
      batchNumber: parsed.batchNumber,
      currentStage: "created",
      currentCustodian: parsed.initialCustodian,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    store.assets.push(asset);
    await storeRepository.saveStore(store);

    const initialEvent = await eventService.recordEvent({
      assetId: asset.id,
      eventType: "batch_created",
      actorId: parsed.actorId,
      actorRole: parsed.actorRole,
      locationName: parsed.locationName,
      fromStage: null,
      toStage: "created",
      fromCustodian: null,
      toCustodian: parsed.initialCustodian,
      notes: parsed.notes,
      documentHash: "",
      documentFilename: "",
      documentType: ""
    });

    return {
      asset,
      initialEvent
    };
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const store = await storeRepository.getStore();
    const counts = new Map<Asset["currentStage"], number>();

    for (const asset of store.assets) {
      counts.set(asset.currentStage, (counts.get(asset.currentStage) ?? 0) + 1);
    }

    return {
      totalAssets: store.assets.length,
      totalEvents: store.events.length,
      latestEvents: [...store.events]
        .sort((a, b) => b.appTimestamp.localeCompare(a.appTimestamp))
        .slice(0, 5),
      assetsByStage: STAGES.map((stage) => ({
        stage,
        count: counts.get(stage) ?? 0
      }))
    };
  }

  getNextEventForAsset(asset: Asset): string | null {
    return getNextAllowedEvent(asset.currentStage);
  }
}

export const assetService = new AssetService();
