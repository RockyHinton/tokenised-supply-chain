import { LedgerAdapter } from "@/lib/ledger/ledgerAdapter";
import { HcsEventPayload, MockLedgerSubmission } from "@/lib/types";
import { nowIso } from "@/lib/utils/dates";
import { prefixedSha256 } from "@/lib/utils/hashes";

export class MockLedgerAdapter implements LedgerAdapter {
  async submit(
    payload: HcsEventPayload,
    input: { ledgerRecordId: string; sequenceNumber: number }
  ): Promise<MockLedgerSubmission> {
    return {
      ledgerRecordId: input.ledgerRecordId,
      status: "SUCCESS",
      network: "mock-hedera-testnet",
      topicId: "0.0.5001",
      sequenceNumber: input.sequenceNumber,
      consensusTimestamp: nowIso(),
      messageHash: prefixedSha256(JSON.stringify(payload)),
      submittedPayload: payload
    };
  }
}
