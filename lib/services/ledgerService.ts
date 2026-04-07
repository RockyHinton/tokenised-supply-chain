import { buildEventPayload } from "@/lib/events/buildEventPayload";
import { LedgerAdapter } from "@/lib/ledger/ledgerAdapter";
import { MockLedgerAdapter } from "@/lib/ledger/mockLedgerAdapter";
import { ledgerRecordRepository } from "@/lib/repositories/ledgerRecordRepository";
import { storeRepository } from "@/lib/repositories/storeRepository";
import {
  Asset,
  DocumentRecord,
  EventRecord,
  HcsEventPayload,
  MockLedgerSubmission,
  StoreData
} from "@/lib/types";

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
    const store = await storeRepository.getStore();
    const record = await this.createSubmissionRecord(payload, store);

    store.ledgerRecords.push(record);
    await storeRepository.saveStore(store);
    return record;
  }

  async createSubmissionRecord(
    payload: HcsEventPayload,
    store: StoreData
  ): Promise<MockLedgerSubmission> {
    return this.adapter.submit(payload, {
      ledgerRecordId: storeRepository.nextId(store, "ledger"),
      sequenceNumber: storeRepository.nextSequence(store)
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
}

export const ledgerService = new LedgerService(new MockLedgerAdapter());
