import { desc } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { assets, documents, events, ledgerRecords } from "@/lib/db/schema";
import { formatId } from "@/lib/utils/ids";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

function incrementFromCurrent(prefix: string, currentId?: string | null) {
  const currentValue = currentId ? Number(currentId.split("_").at(-1) ?? "0") : 0;
  return formatId(prefix, currentValue + 1);
}

export class IdRepository {
  async nextAssetId(executor?: DbExecutor) {
    const [record] = await resolveExecutor(executor)
      .select({ id: assets.id })
      .from(assets)
      .orderBy(desc(assets.id))
      .limit(1);

    return incrementFromCurrent("asset", record?.id);
  }

  async nextEventId(executor?: DbExecutor) {
    const [record] = await resolveExecutor(executor)
      .select({ id: events.id })
      .from(events)
      .orderBy(desc(events.id))
      .limit(1);

    return incrementFromCurrent("evt", record?.id);
  }

  async nextDocumentId(executor?: DbExecutor) {
    const [record] = await resolveExecutor(executor)
      .select({ id: documents.id })
      .from(documents)
      .orderBy(desc(documents.id))
      .limit(1);

    return incrementFromCurrent("doc", record?.id);
  }

  async nextLedgerRecordId(executor?: DbExecutor) {
    const [record] = await resolveExecutor(executor)
      .select({ id: ledgerRecords.id })
      .from(ledgerRecords)
      .orderBy(desc(ledgerRecords.id))
      .limit(1);

    return incrementFromCurrent("mlr", record?.id);
  }

  async nextLedgerSequence(executor?: DbExecutor) {
    const [record] = await resolveExecutor(executor)
      .select({ sequenceNumber: ledgerRecords.sequenceNumber })
      .from(ledgerRecords)
      .orderBy(desc(ledgerRecords.sequenceNumber))
      .limit(1);

    return (record?.sequenceNumber ?? 0) + 1;
  }
}

export const idRepository = new IdRepository();
