import Link from "next/link";
import type { ReactNode } from "react";

import { Card, EmptyState, PageShell, SectionTitle } from "@/components/ui";
import { ledgerService } from "@/lib/services/ledgerService";
import { formatDateTime } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function MockLedgerPage() {
  const records = await ledgerService.listRecords();

  return (
    <PageShell
      title="Mock Ledger Explorer"
      description="Inspect every prepared and submitted HCS-style payload together with topic, sequence, consensus timestamp, and mock network metadata."
    >
      {records.length === 0 ? (
        <EmptyState
          title="No mock ledger records yet"
          description="Record an asset event to generate the first mock Hedera Consensus Service style submission."
        />
      ) : (
        <div className="space-y-5">
          {records.map((record) => (
            <Card key={record.ledgerRecordId}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <SectionTitle title={record.ledgerRecordId} subtitle={record.status} />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Meta label="Network" value={record.network} />
                    <Meta label="Topic ID" value={record.topicId} />
                    <Meta label="Sequence Number" value={record.sequenceNumber} />
                    <Meta
                      label="Consensus Timestamp"
                      value={formatDateTime(record.consensusTimestamp)}
                    />
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate">
                  <div>Hash: {record.messageHash}</div>
                  <Link
                    href={`/ledger/mock/${record.ledgerRecordId}`}
                    className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
                  >
                    View Record
                  </Link>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-ink p-4 text-xs text-slate-100">
                <pre>{JSON.stringify(record.submittedPayload, null, 2)}</pre>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}
