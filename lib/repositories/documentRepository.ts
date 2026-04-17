import { desc, eq } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { ensureDatabaseSeeded } from "@/lib/db/seedRuntime";
import { documents } from "@/lib/db/schema";
import { mapDocumentRowToDomain } from "@/lib/repositories/mappers";
import { DocumentRecord } from "@/lib/types";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

export class DocumentRepository {
  async list(executor?: DbExecutor): Promise<DocumentRecord[]> {
    await ensureDatabaseSeeded(executor);

    const rows = await resolveExecutor(executor)
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));

    return rows.map(mapDocumentRowToDomain);
  }

  async listByAssetId(assetId: string, executor?: DbExecutor): Promise<DocumentRecord[]> {
    await ensureDatabaseSeeded(executor);

    const rows = await resolveExecutor(executor)
      .select()
      .from(documents)
      .where(eq(documents.assetId, assetId))
      .orderBy(desc(documents.createdAt));

    return rows.map(mapDocumentRowToDomain);
  }

  async create(
    document: DocumentRecord & { uploadedByUserId?: string | null; storagePath?: string },
    executor?: DbExecutor
  ): Promise<DocumentRecord> {
    await ensureDatabaseSeeded(executor);

    await resolveExecutor(executor).insert(documents).values({
      id: document.id,
      assetId: document.assetId,
      eventId: document.eventId,
      filename: document.filename,
      documentType: document.documentType,
      storagePath: document.storagePath ?? "",
      hash: document.hash,
      uploadedByUserId: document.uploadedByUserId ?? null,
      createdAt: document.createdAt
    });

    return document;
  }
}

export const documentRepository = new DocumentRepository();
