import {
  Asset,
  DocumentRecord,
  EventRecord,
  MockLedgerSubmission
} from "@/lib/types";

export function mapAssetRowToDomain(row: {
  id: string;
  externalAssetId: string;
  assetType: string;
  name: string;
  description: string;
  batchNumber: string;
  currentStage: string;
  currentCustodianOrganisationId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  originOrganisationName?: string | null;
}): Asset {
  return {
    id: row.id,
    assetId: row.externalAssetId,
    assetType: row.assetType,
    name: row.name,
    description: row.description,
    originSupplier: row.originOrganisationName ?? row.id,
    batchNumber: row.batchNumber,
    currentStage: row.currentStage as Asset["currentStage"],
    currentCustodian: row.currentCustodianOrganisationId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function mapEventRowToDomain(row: {
  id: string;
  assetId: string;
  eventType: string;
  performedByUserId: string | null;
  fromStage: string | null;
  toStage: string;
  fromCustodianOrganisationId: string | null;
  toCustodianOrganisationId: string | null;
  notes: string | null;
  appTimestamp: string;
  ledgerRecordId: string | null;
  locationName?: string | null;
  actorRole?: string | null;
  documentHash?: string | null;
}): EventRecord {
  return {
    id: row.id,
    assetId: row.assetId,
    eventType: row.eventType as EventRecord["eventType"],
    actorId: row.performedByUserId ?? "unknown_actor",
    actorRole: row.actorRole ?? "unknown_role",
    fromStage: row.fromStage as EventRecord["fromStage"],
    toStage: row.toStage as EventRecord["toStage"],
    fromCustodian: row.fromCustodianOrganisationId,
    toCustodian: row.toCustodianOrganisationId,
    locationName: row.locationName ?? null,
    notes: row.notes ?? null,
    documentHash: row.documentHash ?? null,
    appTimestamp: row.appTimestamp,
    ledgerRecordId: row.ledgerRecordId ?? ""
  };
}

export function mapDocumentRowToDomain(row: {
  id: string;
  assetId: string;
  eventId: string;
  filename: string;
  documentType: string;
  hash: string;
  createdAt: string;
}): DocumentRecord {
  return {
    id: row.id,
    assetId: row.assetId,
    eventId: row.eventId,
    filename: row.filename,
    documentType: row.documentType,
    hash: row.hash,
    createdAt: row.createdAt
  };
}

export function mapLedgerRecordRowToDomain(row: {
  id: string;
  status: string;
  network: string;
  topicId: string | null;
  sequenceNumber: number | null;
  consensusTimestamp: string | null;
  messageHash: string | null;
  submittedPayload: MockLedgerSubmission["submittedPayload"];
}): MockLedgerSubmission {
  return {
    ledgerRecordId: row.id,
    status: row.status as MockLedgerSubmission["status"],
    network: row.network as MockLedgerSubmission["network"],
    topicId: (row.topicId ?? "0.0.5001") as MockLedgerSubmission["topicId"],
    sequenceNumber: row.sequenceNumber ?? 0,
    consensusTimestamp: row.consensusTimestamp ?? "",
    messageHash: row.messageHash ?? "",
    submittedPayload: row.submittedPayload
  };
}
