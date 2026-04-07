import { HcsEventPayload, MockLedgerSubmission } from "@/lib/types";

export interface LedgerAdapter {
  submit(payload: HcsEventPayload, input: {
    ledgerRecordId: string;
    sequenceNumber: number;
  }): Promise<MockLedgerSubmission>;
}
