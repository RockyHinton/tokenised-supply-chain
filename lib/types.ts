export const EVENT_TYPES = [
  "batch_created",
  "certificate_attached",
  "shipped",
  "received",
  "inspected"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const STAGES = [
  "created",
  "certified",
  "shipped",
  "received",
  "inspected"
] as const;

export type AssetStage = (typeof STAGES)[number];

export interface Asset {
  id: string;
  assetId: string;
  assetType: string;
  name: string;
  description: string;
  originSupplier: string;
  batchNumber: string;
  currentStage: AssetStage;
  currentCustodian: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  assetId: string;
  eventId: string;
  filename: string;
  documentType: string;
  hash: string;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  assetId: string;
  eventType: EventType;
  actorId: string;
  actorRole: string;
  fromStage: AssetStage | null;
  toStage: AssetStage;
  fromCustodian: string | null;
  toCustodian: string | null;
  locationName: string | null;
  notes: string | null;
  documentHash: string | null;
  appTimestamp: string;
  ledgerRecordId: string;
}

export interface HcsDocumentRef {
  documentId: string;
  documentType: string;
  hash: string;
}

export interface HcsEventPayload {
  version: "1.0";
  eventId: string;
  assetId: string;
  assetType: string;
  eventType: EventType;
  actor: {
    actorId: string;
    actorRole: string;
  };
  location?: {
    siteId: string;
    siteName: string;
  };
  stageTransition: {
    from: AssetStage | null;
    to: AssetStage;
  };
  custodyTransition?: {
    from: string | null;
    to: string | null;
  };
  documentRefs?: HcsDocumentRef[];
  metadata?: {
    batchNumber?: string;
    notes?: string;
  };
  appTimestamp: string;
}

export interface MockLedgerSubmission {
  ledgerRecordId: string;
  status: "SUCCESS";
  network: "mock-hedera-testnet";
  topicId: "0.0.5001";
  sequenceNumber: number;
  consensusTimestamp: string;
  messageHash: string;
  submittedPayload: HcsEventPayload;
}

export interface AssetWithRelations extends Asset {
  events: EventRecord[];
  documents: DocumentRecord[];
  latestLedgerRecord: MockLedgerSubmission | null;
}

export interface DashboardSummary {
  totalAssets: number;
  totalEvents: number;
  latestEvents: EventRecord[];
  assetsByStage: Array<{
    stage: AssetStage;
    count: number;
  }>;
}

export interface StoreData {
  meta: {
    counters: {
      asset: number;
      event: number;
      document: number;
      ledger: number;
      sequence: number;
    };
  };
  assets: Asset[];
  events: EventRecord[];
  documents: DocumentRecord[];
  ledgerRecords: MockLedgerSubmission[];
}

export interface PreparedEventContext {
  asset: Asset;
  event: Omit<EventRecord, "ledgerRecordId">;
  documents: DocumentRecord[];
}
