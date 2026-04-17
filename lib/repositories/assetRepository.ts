import { eq, desc } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { ensureDatabaseSeeded } from "@/lib/db/seedRuntime";
import { assets, organisations } from "@/lib/db/schema";
import { mapAssetRowToDomain } from "@/lib/repositories/mappers";
import { Asset } from "@/lib/types";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

export class AssetRepository {
  async list(executor?: DbExecutor): Promise<Asset[]> {
    await ensureDatabaseSeeded(executor);

    const rows = await resolveExecutor(executor)
      .select({
        id: assets.id,
        externalAssetId: assets.externalAssetId,
        assetType: assets.assetType,
        name: assets.name,
        description: assets.description,
        batchNumber: assets.batchNumber,
        currentStage: assets.currentStage,
        currentCustodianOrganisationId: assets.currentCustodianOrganisationId,
        status: assets.status,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        originOrganisationName: organisations.name
      })
      .from(assets)
      .innerJoin(organisations, eq(assets.originOrganisationId, organisations.id))
      .orderBy(desc(assets.updatedAt));

    return rows.map(mapAssetRowToDomain);
  }

  async getById(id: string, executor?: DbExecutor): Promise<Asset | null> {
    await ensureDatabaseSeeded(executor);

    const row = await resolveExecutor(executor)
      .select({
        id: assets.id,
        externalAssetId: assets.externalAssetId,
        assetType: assets.assetType,
        name: assets.name,
        description: assets.description,
        batchNumber: assets.batchNumber,
        currentStage: assets.currentStage,
        currentCustodianOrganisationId: assets.currentCustodianOrganisationId,
        status: assets.status,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        originOrganisationName: organisations.name
      })
      .from(assets)
      .innerJoin(organisations, eq(assets.originOrganisationId, organisations.id))
      .where(eq(assets.id, id))
      .limit(1);

    return row[0] ? mapAssetRowToDomain(row[0]) : null;
  }

  async create(
    asset: Asset & { originOrganisationId: string; currentCustodianOrganisationId: string },
    executor?: DbExecutor
  ): Promise<Asset> {
    await ensureDatabaseSeeded(executor);

    await resolveExecutor(executor).insert(assets).values({
      id: asset.id,
      externalAssetId: asset.assetId,
      assetType: asset.assetType,
      name: asset.name,
      description: asset.description,
      batchNumber: asset.batchNumber,
      originOrganisationId: asset.originOrganisationId,
      currentStage: asset.currentStage,
      currentCustodianOrganisationId: asset.currentCustodianOrganisationId,
      status: asset.status,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    });

    return asset;
  }

  async update(
    asset: Asset & { currentCustodianOrganisationId?: string },
    executor?: DbExecutor
  ): Promise<Asset> {
    await ensureDatabaseSeeded(executor);

    const result = await resolveExecutor(executor)
      .update(assets)
      .set({
        externalAssetId: asset.assetId,
        assetType: asset.assetType,
        name: asset.name,
        description: asset.description,
        batchNumber: asset.batchNumber,
        currentStage: asset.currentStage,
        currentCustodianOrganisationId:
          asset.currentCustodianOrganisationId ?? asset.currentCustodian,
        status: asset.status,
        updatedAt: asset.updatedAt
      })
      .where(eq(assets.id, asset.id))
      .returning({ id: assets.id });

    if (result.length === 0) {
      throw new Error(`Asset not found: ${asset.id}`);
    }

    return asset;
  }
}

export const assetRepository = new AssetRepository();
