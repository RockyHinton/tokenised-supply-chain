import { buildEventPayload } from "@/lib/events/buildEventPayload";
import { getDb, type DbClient } from "@/lib/db/client";
import { LedgerAdapter } from "@/lib/ledger/ledgerAdapter";
import { MockLedgerAdapter } from "@/lib/ledger/mockLedgerAdapter";
import { idRepository } from "@/lib/repositories/idRepository";
import { ledgerRecordRepository } from "@/lib/repositories/ledgerRecordRepository";
import {
  Asset,
  DocumentRecord,
  EventRecord,
  HcsEventPayload,
  MockLedgerSubmission
} from "@/lib/types";

type DbExecutor = DbClient;

export class LedgerService {
  constructor(private readonly adapter: LedgerAdapter) {}

  prepareSubmission(input: {
    asset: Asset;
    event: Omit<EventRecord, "ledgerRecordId">;
    documents: DocumentRecord[];
  }): HcsEventPayload {
    return buildEventPayload(input);
  }

  async submitPayload(payload: HcsEventPayload): Promise<MockLedgerSubmission> {
    const record = await this.createSubmissionRecord(payload);
    await ledgerRecordRepository.create({
      ...record,
      eventId: record.submittedPayload.eventId
    });
    return record;
  }

  async createSubmissionRecord(
    payload: HcsEventPayload,
    options?: {
      executor?: DbExecutor;
      ledgerRecordId?: string;
      sequenceNumber?: number;
    }
  ) {
    return this.adapter.submit(payload, {
      ledgerRecordId:
        options?.ledgerRecordId ??
        (await idRepository.nextLedgerRecordId(options?.executor)),
      sequenceNumber:
        options?.sequenceNumber ??
        (await idRepository.nextLedgerSequence(options?.executor))
    });
  }

  async createPersistedSubmission(input: {
    asset: Asset;
    event: Omit<EventRecord, "ledgerRecordId">;
    documents: DocumentRecord[];
  }): Promise<{ payload: HcsEventPayload; record: MockLedgerSubmission }> {
    const payload = this.prepareSubmission(input);
    const record = await this.submitPayload(payload);
    return { payload, record };
  }

  async listRecords(): Promise<MockLedgerSubmission[]> {
    return ledgerRecordRepository.list();
  }

  async getRecordById(id: string): Promise<MockLedgerSubmission | null> {
    return ledgerRecordRepository.getById(id);
  }

  async withTransaction<T>(callback: (tx: DbExecutor) => Promise<T>) {
    return getDb().transaction(async (tx) => callback(tx as unknown as DbExecutor));
  }
}

export const ledgerService = new LedgerService(new MockLedgerAdapter());
