import {
  EventWorkflowAssetOption,
  analyzeAssetAudit,
  buildEventWorkflowDefaults
} from "@/lib/domain/assetAudit";
import { assetRepository } from "@/lib/repositories/assetRepository";
import { documentRepository } from "@/lib/repositories/documentRepository";
import { eventRepository } from "@/lib/repositories/eventRepository";
import { idRepository } from "@/lib/repositories/idRepository";
import { ledgerRecordRepository } from "@/lib/repositories/ledgerRecordRepository";
import { organisationRepository } from "@/lib/repositories/organisationRepository";
import { Asset, AssetWithRelations, DashboardSummary, EventRecord, STAGES } from "@/lib/types";
import { getNextAllowedEvent } from "@/lib/validation/lifecycleRules";
import { CreateAssetInput, createAssetSchema } from "@/lib/validation/schemas";
import { nowIso } from "@/lib/utils/dates";
import { eventService } from "@/lib/services/eventService";
import { ledgerService } from "@/lib/services/ledgerService";
import { locationRepository } from "@/lib/repositories/locationRepository";
import { userRepository } from "@/lib/repositories/userRepository";

export class AssetService {
  async listAssets(): Promise<Array<Asset & { lastEventDate: string | null }>> {
    const [assets, events] = await Promise.all([assetRepository.list(), eventRepository.list()]);

    return [...assets]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((asset) => {
        const lastEvent = events
          .filter((event) => event.assetId === asset.id)
          .sort((a, b) => b.appTimestamp.localeCompare(a.appTimestamp))[0];

        return {
          ...asset,
          lastEventDate: lastEvent?.appTimestamp ?? null
        };
      });
  }

  async getAssetById(assetId: string): Promise<AssetWithRelations | null> {
    const asset = await assetRepository.getById(assetId);

    if (!asset) {
      return null;
    }

    const [events, documents, ledgerRecords] = await Promise.all([
      eventRepository.listByAssetId(asset.id),
      documentRepository.listByAssetId(asset.id),
      ledgerRecordRepository.list()
    ]);
    const latestLedgerRecord = [...ledgerRecords]
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
    const asset = await assetRepository.getById(assetId);

    if (!asset) {
      return null;
    }

    const [events, documents, allLedgerRecords] = await Promise.all([
      eventRepository.listByAssetId(asset.id),
      documentRepository.listByAssetId(asset.id),
      ledgerRecordRepository.list()
    ]);
    const ledgerRecords = allLedgerRecords
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
    const [assets, events, documents, ledgerRecords] = await Promise.all([
      assetRepository.list(),
      eventRepository.list(),
      documentRepository.list(),
      ledgerRecordRepository.list()
    ]);

    return assets
      .map((asset) => {
        const assetEvents = events
          .filter((event) => event.assetId === asset.id)
          .sort((a, b) => a.appTimestamp.localeCompare(b.appTimestamp));
        const assetDocuments = documents.filter((document) => document.assetId === asset.id);
        const assetLedgerRecords = ledgerRecords.filter(
          (record) => record.submittedPayload.assetId === asset.id
        );
        const analysis = analyzeAssetAudit({
          asset,
          events: assetEvents,
          documents: assetDocuments,
          ledgerRecords: assetLedgerRecords
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
    return ledgerService.withTransaction(async (tx) => {
      const originOrganisationId = parsed.originOrganisationId ?? parsed.initialCustodian;
      const originOrganisation = await organisationRepository.getById(originOrganisationId, tx);

      if (!originOrganisation) {
        throw new Error("Selected origin supplier is not available in the database.");
      }

      const initialCustodian = await organisationRepository.getById(parsed.initialCustodian, tx);

      if (!initialCustodian) {
        throw new Error("Selected initial custodian is not available in the database.");
      }

      const actor = await userRepository.getById(parsed.actorId, tx);

      if (!actor) {
        throw new Error("Selected actor is not available in the database.");
      }

      const location = parsed.locationId
        ? await locationRepository.getById(parsed.locationId, tx)
        : null;

      if (parsed.locationId && !location) {
        throw new Error("Selected location is not available in the database.");
      }

      const timestamp = nowIso();
      const asset: Asset = {
        id: await idRepository.nextAssetId(tx),
        assetId: parsed.assetId,
        assetType: parsed.assetType,
        name: parsed.name,
        description: parsed.description,
        originSupplier: originOrganisation.name,
        batchNumber: parsed.batchNumber,
        currentStage: "created",
        currentCustodian: initialCustodian.id,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await assetRepository.create(
        {
          ...asset,
          originOrganisationId: originOrganisation.id,
          currentCustodianOrganisationId: initialCustodian.id
        },
        tx
      );

      const initialEvent = await eventService.recordEventWithExecutor(
        {
          assetId: asset.id,
          eventType: "batch_created",
          actorId: actor.id,
          actorRole: actor.role,
          locationName: location?.name ?? parsed.locationName,
          locationId: location?.id ?? "",
          fromStage: null,
          toStage: "created",
          fromCustodian: null,
          toCustodian: initialCustodian.id,
          notes: parsed.notes,
          documentHash: "",
          documentFilename: "",
          documentType: ""
        },
        tx
      );

      const persistedAsset = await assetRepository.getById(asset.id, tx);

      if (!persistedAsset) {
        throw new Error("Asset was not persisted.");
      }

      return {
        asset: persistedAsset,
        initialEvent
      };
    });
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const [assets, events] = await Promise.all([assetRepository.list(), eventRepository.list()]);
    const counts = new Map<Asset["currentStage"], number>();

    for (const asset of assets) {
      counts.set(asset.currentStage, (counts.get(asset.currentStage) ?? 0) + 1);
    }

    return {
      totalAssets: assets.length,
      totalEvents: events.length,
      latestEvents: [...events]
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
