import { notFound } from "next/navigation";

import { Card, PageShell, SectionTitle } from "@/components/ui";
import { ledgerService } from "@/lib/services/ledgerService";
import { formatDateTime } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function LedgerRecordDetailPage({
  params
}: {
  params: Promise<{ ledgerRecordId: string }>;
}) {
  const { ledgerRecordId } = await params;
  const record = await ledgerService.getRecordById(ledgerRecordId);

  if (!record) {
    notFound();
  }

  return (
    <PageShell
      title={record.ledgerRecordId}
      description="Technical proof view for a single mock ledger submission, including network metadata and the exact submitted payload."
    >
      <Card>
        <SectionTitle title="Ledger Record" subtitle={record.status} />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Meta label="Network" value={record.network} />
          <Meta label="Topic ID" value={record.topicId} />
          <Meta label="Sequence Number" value={record.sequenceNumber} />
          <Meta label="Consensus Timestamp" value={formatDateTime(record.consensusTimestamp)} />
          <Meta label="Message Hash" value={record.messageHash} />
          <Meta label="Asset ID" value={record.submittedPayload.assetId} />
          <Meta label="Event ID" value={record.submittedPayload.eventId} />
          <Meta label="Event Type" value={record.submittedPayload.eventType} />
        </div>
      </Card>

      <Card>
        <SectionTitle title="Submitted Payload JSON" />
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-ink p-4 text-xs text-slate-100">
          <pre>{JSON.stringify(record.submittedPayload, null, 2)}</pre>
        </div>
      </Card>
    </PageShell>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}
