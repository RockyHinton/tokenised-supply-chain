import { count } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import {
  assets,
  documents,
  events,
  ledgerRecords,
  locations,
  organisations,
  users
} from "@/lib/db/schema";
import { seedData } from "@/lib/db/seed";
import { nowIso } from "@/lib/utils/dates";
import { sha256 } from "@/lib/utils/hashes";

type DbExecutor = DbClient;

let seedPromise: Promise<void> | null = null;

const seedOrganisations = [
  {
    id: "supplier_001",
    name: "Kumasi Growers Cooperative",
    type: "supplier"
  },
  {
    id: "supplier_002",
    name: "North Port Packaging",
    type: "supplier"
  },
  {
    id: "carrier_001",
    name: "Export Carrier One",
    type: "carrier"
  },
  {
    id: "warehouse_uk_001",
    name: "Distribution Hub West",
    type: "warehouse"
  },
  {
    id: "ops_internal",
    name: "Operations Control",
    type: "internal"
  }
];

const seedUsers = [
  {
    id: "supplier_001",
    organisationId: "supplier_001",
    name: "Supplier Operator 001",
    email: "supplier_001@example.local",
    role: "supplier"
  },
  {
    id: "qa_001",
    organisationId: "ops_internal",
    name: "Quality Manager 001",
    email: "qa_001@example.local",
    role: "quality_manager"
  },
  {
    id: "logistics_001",
    organisationId: "carrier_001",
    name: "Logistics Operator 001",
    email: "logistics_001@example.local",
    role: "logistics"
  },
  {
    id: "warehouse_uk_001",
    organisationId: "warehouse_uk_001",
    name: "Warehouse Operator UK 001",
    email: "warehouse_uk_001@example.local",
    role: "warehouse"
  }
];

const seedLocations = [
  {
    id: "site_001",
    organisationId: "supplier_001",
    name: "Supplier Warehouse A",
    code: "SUP-WH-A",
    type: "warehouse"
  },
  {
    id: "site_002",
    organisationId: "ops_internal",
    name: "Certification Desk",
    code: "CERT-DESK",
    type: "inspection"
  },
  {
    id: "site_003",
    organisationId: "carrier_001",
    name: "Port of Tema",
    code: "PORT-TEMA",
    type: "port"
  },
  {
    id: "site_004",
    organisationId: "warehouse_uk_001",
    name: "Distribution Hub West",
    code: "DIST-HUB-WEST",
    type: "warehouse"
  }
];

function deriveLocationId(name: string): string {
  return `site_${sha256(name).slice(0, 6)}`;
}

function mapOrganisationIdFromName(name: string): string {
  if (name === "Kumasi Growers Cooperative") {
    return "supplier_001";
  }

  if (name === "North Port Packaging") {
    return "supplier_002";
  }

  return `org_${sha256(name).slice(0, 8)}`;
}

async function seedIfEmpty(executor: DbExecutor) {
  const [{ value: organisationCount }] = await executor
    .select({ value: count() })
    .from(organisations);

  if (organisationCount > 0) {
    return;
  }

  const timestamp = nowIso();

  await executor.insert(organisations).values(
    seedOrganisations.map((organisation) => ({
      ...organisation,
      createdAt: timestamp,
      updatedAt: timestamp
    }))
  );

  await executor.insert(users).values(
    seedUsers.map((user) => ({
      ...user,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }))
  );

  await executor.insert(locations).values(
    seedLocations.map((location) => ({
      ...location,
      createdAt: timestamp,
      updatedAt: timestamp
    }))
  );

  await executor.insert(assets).values(
    seedData.assets.map((asset) => ({
      id: asset.id,
      externalAssetId: asset.assetId,
      assetType: asset.assetType,
      name: asset.name,
      description: asset.description,
      batchNumber: asset.batchNumber,
      originOrganisationId: mapOrganisationIdFromName(asset.originSupplier),
      currentStage: asset.currentStage,
      currentCustodianOrganisationId: asset.currentCustodian,
      status: asset.status,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    }))
  );

  await executor.insert(events).values(
    seedData.events.map((event) => ({
      id: event.id,
      assetId: event.assetId,
      eventType: event.eventType,
      performedByUserId: event.actorId,
      performedByOrganisationId:
        event.actorId === "supplier_001" ? "supplier_001" : null,
      locationId: event.locationName
        ? seedLocations.find((location) => location.name === event.locationName)?.id ??
          deriveLocationId(event.locationName)
        : null,
      fromStage: event.fromStage,
      toStage: event.toStage,
      fromCustodianOrganisationId: event.fromCustodian,
      toCustodianOrganisationId: event.toCustodian,
      notes: event.notes,
      appTimestamp: event.appTimestamp,
      ledgerRecordId: event.ledgerRecordId,
      createdAt: event.appTimestamp
    }))
  );

  await executor.insert(documents).values(
    seedData.documents.map((document) => ({
      id: document.id,
      assetId: document.assetId,
      eventId: document.eventId,
      documentType: document.documentType,
      filename: document.filename,
      storagePath: "",
      hash: document.hash,
      uploadedByUserId: null,
      createdAt: document.createdAt
    }))
  );

  await executor.insert(ledgerRecords).values(
    seedData.ledgerRecords.map((record) => ({
      id: record.ledgerRecordId,
      eventId: record.submittedPayload.eventId,
      status: record.status,
      network: record.network,
      topicId: record.topicId,
      sequenceNumber: record.sequenceNumber,
      consensusTimestamp: record.consensusTimestamp,
      messageHash: record.messageHash,
      submittedPayload: record.submittedPayload,
      createdAt: record.consensusTimestamp
    }))
  );
}

export async function ensureDatabaseSeeded(executor?: DbExecutor) {
  if (executor) {
    await seedIfEmpty(executor);
    return;
  }

  if (!seedPromise) {
    seedPromise = getDb().transaction(async (tx) => {
      await seedIfEmpty(tx as unknown as DbExecutor);
    });
  }

  await seedPromise;
}
