import { prefixedSha256 } from "@/lib/utils/hashes";
import { StoreData } from "@/lib/types";

export const seedData: StoreData = {
  meta: {
    counters: {
      asset: 2,
      event: 4,
      document: 2,
      ledger: 4,
      sequence: 4
    }
  },
  assets: [
    {
      id: "asset_000001",
      assetId: "RM-COCOA-001",
      assetType: "raw_material_batch",
      name: "Premium Cocoa Beans",
      description: "Single-origin cocoa batch prepared for export.",
      originSupplier: "Kumasi Growers Cooperative",
      batchNumber: "BATCH-001",
      currentStage: "received",
      currentCustodian: "warehouse_uk_001",
      status: "active",
      createdAt: "2026-04-07T15:00:00Z",
      updatedAt: "2026-04-07T15:45:00Z"
    },
    {
      id: "asset_000002",
      assetId: "CMP-LINER-009",
      assetType: "packaging_component",
      name: "Food Grade Liner Rolls",
      description: "Packaging liner stock for finished goods preparation.",
      originSupplier: "North Port Packaging",
      batchNumber: "BATCH-002",
      currentStage: "created",
      currentCustodian: "supplier_002",
      status: "active",
      createdAt: "2026-04-07T16:00:00Z",
      updatedAt: "2026-04-07T16:00:00Z"
    }
  ],
  events: [
    {
      id: "evt_000001",
      assetId: "asset_000001",
      eventType: "batch_created",
      actorId: "supplier_001",
      actorRole: "supplier",
      fromStage: null,
      toStage: "created",
      fromCustodian: null,
      toCustodian: "supplier_001",
      locationName: "Supplier Warehouse A",
      notes: "Initial batch registration",
      documentHash: null,
      appTimestamp: "2026-04-07T15:00:00Z",
      ledgerRecordId: "mlr_000001"
    },
    {
      id: "evt_000002",
      assetId: "asset_000001",
      eventType: "certificate_attached",
      actorId: "qa_001",
      actorRole: "quality_manager",
      fromStage: "created",
      toStage: "certified",
      fromCustodian: "supplier_001",
      toCustodian: "supplier_001",
      locationName: "Certification Desk",
      notes: "Certificate of origin attached",
      documentHash: prefixedSha256("certificate_of_origin:BATCH-001"),
      appTimestamp: "2026-04-07T15:20:00Z",
      ledgerRecordId: "mlr_000002"
    },
    {
      id: "evt_000003",
      assetId: "asset_000001",
      eventType: "shipped",
      actorId: "logistics_001",
      actorRole: "logistics",
      fromStage: "certified",
      toStage: "shipped",
      fromCustodian: "supplier_001",
      toCustodian: "carrier_001",
      locationName: "Port of Tema",
      notes: "Released to carrier for export shipment",
      documentHash: null,
      appTimestamp: "2026-04-07T15:30:00Z",
      ledgerRecordId: "mlr_000003"
    },
    {
      id: "evt_000004",
      assetId: "asset_000001",
      eventType: "received",
      actorId: "warehouse_uk_001",
      actorRole: "warehouse",
      fromStage: "shipped",
      toStage: "received",
      fromCustodian: "carrier_001",
      toCustodian: "warehouse_uk_001",
      locationName: "Distribution Hub West",
      notes: "Batch received into storage",
      documentHash: null,
      appTimestamp: "2026-04-07T15:45:00Z",
      ledgerRecordId: "mlr_000004"
    }
  ],
  documents: [
    {
      id: "doc_000001",
      assetId: "asset_000001",
      eventId: "evt_000002",
      filename: "certificate-of-origin.pdf",
      documentType: "certificate_of_origin",
      hash: prefixedSha256("certificate_of_origin:BATCH-001"),
      createdAt: "2026-04-07T15:20:00Z"
    },
    {
      id: "doc_000002",
      assetId: "asset_000001",
      eventId: "evt_000004",
      filename: "goods-received-note.pdf",
      documentType: "goods_received_note",
      hash: prefixedSha256("goods_received:BATCH-001"),
      createdAt: "2026-04-07T15:45:00Z"
    }
  ],
  ledgerRecords: [
    {
      ledgerRecordId: "mlr_000001",
      status: "SUCCESS",
      network: "mock-hedera-testnet",
      topicId: "0.0.5001",
      sequenceNumber: 1,
      consensusTimestamp: "2026-04-07T15:00:02.123Z",
      messageHash: prefixedSha256("mlr_000001"),
      submittedPayload: {
        version: "1.0",
        eventId: "evt_000001",
        assetId: "asset_000001",
        assetType: "raw_material_batch",
        eventType: "batch_created",
        actor: {
          actorId: "supplier_001",
          actorRole: "supplier"
        },
        location: {
          siteId: "site_001",
          siteName: "Supplier Warehouse A"
        },
        stageTransition: {
          from: null,
          to: "created"
        },
        custodyTransition: {
          from: null,
          to: "supplier_001"
        },
        documentRefs: [],
        metadata: {
          batchNumber: "BATCH-001",
          notes: "Initial batch registration"
        },
        appTimestamp: "2026-04-07T15:00:00Z"
      }
    },
    {
      ledgerRecordId: "mlr_000002",
      status: "SUCCESS",
      network: "mock-hedera-testnet",
      topicId: "0.0.5001",
      sequenceNumber: 2,
      consensusTimestamp: "2026-04-07T15:20:02.123Z",
      messageHash: prefixedSha256("mlr_000002"),
      submittedPayload: {
        version: "1.0",
        eventId: "evt_000002",
        assetId: "asset_000001",
        assetType: "raw_material_batch",
        eventType: "certificate_attached",
        actor: {
          actorId: "qa_001",
          actorRole: "quality_manager"
        },
        location: {
          siteId: "site_002",
          siteName: "Certification Desk"
        },
        stageTransition: {
          from: "created",
          to: "certified"
        },
        custodyTransition: {
          from: "supplier_001",
          to: "supplier_001"
        },
        documentRefs: [
          {
            documentId: "doc_000001",
            documentType: "certificate_of_origin",
            hash: prefixedSha256("certificate_of_origin:BATCH-001")
          }
        ],
        metadata: {
          batchNumber: "BATCH-001",
          notes: "Certificate of origin attached"
        },
        appTimestamp: "2026-04-07T15:20:00Z"
      }
    },
    {
      ledgerRecordId: "mlr_000003",
      status: "SUCCESS",
      network: "mock-hedera-testnet",
      topicId: "0.0.5001",
      sequenceNumber: 3,
      consensusTimestamp: "2026-04-07T15:30:02.123Z",
      messageHash: prefixedSha256("mlr_000003"),
      submittedPayload: {
        version: "1.0",
        eventId: "evt_000003",
        assetId: "asset_000001",
        assetType: "raw_material_batch",
        eventType: "shipped",
        actor: {
          actorId: "logistics_001",
          actorRole: "logistics"
        },
        location: {
          siteId: "site_003",
          siteName: "Port of Tema"
        },
        stageTransition: {
          from: "certified",
          to: "shipped"
        },
        custodyTransition: {
          from: "supplier_001",
          to: "carrier_001"
        },
        documentRefs: [],
        metadata: {
          batchNumber: "BATCH-001",
          notes: "Released to carrier for export shipment"
        },
        appTimestamp: "2026-04-07T15:30:00Z"
      }
    },
    {
      ledgerRecordId: "mlr_000004",
      status: "SUCCESS",
      network: "mock-hedera-testnet",
      topicId: "0.0.5001",
      sequenceNumber: 4,
      consensusTimestamp: "2026-04-07T15:45:02.123Z",
      messageHash: prefixedSha256("mlr_000004"),
      submittedPayload: {
        version: "1.0",
        eventId: "evt_000004",
        assetId: "asset_000001",
        assetType: "raw_material_batch",
        eventType: "received",
        actor: {
          actorId: "warehouse_uk_001",
          actorRole: "warehouse"
        },
        location: {
          siteId: "site_004",
          siteName: "Distribution Hub West"
        },
        stageTransition: {
          from: "shipped",
          to: "received"
        },
        custodyTransition: {
          from: "carrier_001",
          to: "warehouse_uk_001"
        },
        documentRefs: [
          {
            documentId: "doc_000002",
            documentType: "goods_received_note",
            hash: prefixedSha256("goods_received:BATCH-001")
          }
        ],
        metadata: {
          batchNumber: "BATCH-001",
          notes: "Batch received into storage"
        },
        appTimestamp: "2026-04-07T15:45:00Z"
      }
    }
  ]
};
