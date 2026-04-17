import { desc, eq } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { ensureDatabaseSeeded } from "@/lib/db/seedRuntime";
import { ledgerRecords } from "@/lib/db/schema";
import { mapLedgerRecordRowToDomain } from "@/lib/repositories/mappers";
import { MockLedgerSubmission } from "@/lib/types";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

export class LedgerRecordRepository {
  async list(executor?: DbExecutor): Promise<MockLedgerSubmission[]> {
    await ensureDatabaseSeeded(executor);

    const rows = await resolveExecutor(executor)
      .select()
      .from(ledgerRecords)
      .orderBy(desc(ledgerRecords.sequenceNumber));

    return rows.map(mapLedgerRecordRowToDomain);
  }

  async getById(id: string, executor?: DbExecutor): Promise<MockLedgerSubmission | null> {
    await ensureDatabaseSeeded(executor);

    const row = await resolveExecutor(executor)
      .select()
      .from(ledgerRecords)
      .where(eq(ledgerRecords.id, id))
      .limit(1);

    return row[0] ? mapLedgerRecordRowToDomain(row[0]) : null;
  }

  async create(
    record: MockLedgerSubmission & { eventId: string; createdAt?: string },
    executor?: DbExecutor
  ): Promise<MockLedgerSubmission> {
    await ensureDatabaseSeeded(executor);

    await resolveExecutor(executor).insert(ledgerRecords).values({
      id: record.ledgerRecordId,
      eventId: record.eventId,
      status: record.status,
      network: record.network,
      topicId: record.topicId,
      sequenceNumber: record.sequenceNumber,
      consensusTimestamp: record.consensusTimestamp,
      messageHash: record.messageHash,
      submittedPayload: record.submittedPayload,
      createdAt: record.createdAt ?? record.consensusTimestamp
    });

    return record;
  }
}

export const ledgerRecordRepository = new LedgerRecordRepository();
