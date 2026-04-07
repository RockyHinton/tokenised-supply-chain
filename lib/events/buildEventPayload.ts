import { DocumentRecord, HcsDocumentRef, HcsEventPayload, PreparedEventContext } from "@/lib/types";
import { sha256 } from "@/lib/utils/hashes";

function buildSiteId(locationName?: string | null): string | undefined {
  if (!locationName) {
    return undefined;
  }

  return `site_${sha256(locationName).slice(0, 6)}`;
}

function toDocumentRefs(documents: DocumentRecord[]): HcsDocumentRef[] {
  return documents.map((document) => ({
    documentId: document.id,
    documentType: document.documentType,
    hash: document.hash
  }));
}

export function buildEventPayload(context: PreparedEventContext): HcsEventPayload {
  const { asset, event, documents } = context;
  const payload: HcsEventPayload = {
    version: "1.0",
    eventId: event.id,
    assetId: asset.id,
    assetType: asset.assetType,
    eventType: event.eventType,
    actor: {
      actorId: event.actorId,
      actorRole: event.actorRole
    },
    stageTransition: {
      from: event.fromStage,
      to: event.toStage
    },
    appTimestamp: event.appTimestamp
  };

  if (event.locationName) {
    payload.location = {
      siteId: buildSiteId(event.locationName) ?? "site_unknown",
      siteName: event.locationName
    };
  }

  payload.custodyTransition = {
    from: event.fromCustodian,
    to: event.toCustodian
  };

  payload.documentRefs = toDocumentRefs(documents);
  payload.metadata = {
    batchNumber: asset.batchNumber,
    notes: event.notes ?? undefined
  };

  return payload;
}
