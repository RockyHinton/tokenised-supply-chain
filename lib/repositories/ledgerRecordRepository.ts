import { storeRepository } from "@/lib/repositories/storeRepository";
import { MockLedgerSubmission } from "@/lib/types";

export class LedgerRecordRepository {
  async list(): Promise<MockLedgerSubmission[]> {
    const store = await storeRepository.getStore();
    return [...store.ledgerRecords].sort(
      (a, b) => b.sequenceNumber - a.sequenceNumber
    );
  }

  async getById(id: string): Promise<MockLedgerSubmission | null> {
    const store = await storeRepository.getStore();
    return store.ledgerRecords.find((record) => record.ledgerRecordId === id) ?? null;
  }

  async create(record: MockLedgerSubmission): Promise<MockLedgerSubmission> {
    const store = await storeRepository.getStore();
    store.ledgerRecords.push(record);
    await storeRepository.saveStore(store);
    return record;
  }
}

export const ledgerRecordRepository = new LedgerRecordRepository();
