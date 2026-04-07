import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, PageShell, SectionTitle } from "@/components/ui";
import { assetService } from "@/lib/services/assetService";
import { formatDateTime } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const asset = await assetService.getAssetById(assetId);

  if (!asset) {
    notFound();
  }

  return (
    <PageShell
      title={`${asset.assetId}`}
      description="Asset summary, linked documents, immutable-style event timeline, and latest mock ledger reference."
      actions={
        <Link
          href={`/events/new?assetId=${asset.id}`}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent"
        >
          Record Next Event
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <SectionTitle title="Asset Summary" />
          <SummaryRow label="Asset Type" value={asset.assetType} />
          <SummaryRow label="Name" value={asset.name} />
          <SummaryRow label="Description" value={asset.description} />
          <SummaryRow label="Origin Supplier" value={asset.originSupplier} />
          <SummaryRow label="Batch Number" value={asset.batchNumber} />
          <SummaryRow label="Current Stage" value={<Badge>{asset.currentStage}</Badge>} />
          <SummaryRow label="Current Custodian" value={asset.currentCustodian} />
          <SummaryRow label="Status" value={asset.status} />
          <SummaryRow label="Created" value={formatDateTime(asset.createdAt)} />
          <SummaryRow label="Updated" value={formatDateTime(asset.updatedAt)} />
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle title="Latest Mock Ledger Reference" />
            {asset.latestLedgerRecord ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SummaryRow label="Ledger Record ID" value={asset.latestLedgerRecord.ledgerRecordId} />
                <SummaryRow label="Topic ID" value={asset.latestLedgerRecord.topicId} />
                <SummaryRow label="Sequence" value={asset.latestLedgerRecord.sequenceNumber} />
                <SummaryRow
                  label="Consensus Time"
                  value={formatDateTime(asset.latestLedgerRecord.consensusTimestamp)}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate">No ledger submission has been recorded yet.</p>
            )}
          </Card>

          <Card>
            <SectionTitle title="Linked Documents" />
            <div className="mt-4 space-y-3">
              {asset.documents.length === 0 ? (
                <p className="text-sm text-slate">No documents linked to this asset yet.</p>
              ) : (
                asset.documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-line/70 p-4">
                    <p className="text-sm font-semibold">{document.filename}</p>
                    <p className="mt-1 text-sm text-slate">
                      {document.documentType} · {document.hash}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Event Timeline" subtitle="Chronological audit trail for this asset." />
        <div className="mt-6 space-y-4">
          {asset.events.map((event, index) => (
            <div key={event.id} className="grid gap-4 md:grid-cols-[32px_1fr]">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-accent" />
                {index < asset.events.length - 1 ? <div className="mt-2 h-full w-px bg-line" /> : null}
              </div>
              <div className="rounded-2xl border border-line/80 bg-mist/30 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{event.eventType}</p>
                    <p className="text-sm text-slate">
                      {event.fromStage ?? "null"} to {event.toStage} · {event.actorId}
                    </p>
                  </div>
                  <div className="text-sm text-slate">{formatDateTime(event.appTimestamp)}</div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <SummaryRow label="Actor Role" value={event.actorRole} />
                  <SummaryRow label="Location" value={event.locationName ?? "N/A"} />
                  <SummaryRow label="From Custodian" value={event.fromCustodian ?? "N/A"} />
                  <SummaryRow label="To Custodian" value={event.toCustodian ?? "N/A"} />
                  <SummaryRow label="Ledger Record" value={event.ledgerRecordId} />
                  <SummaryRow label="Document Hash" value={event.documentHash ?? "N/A"} />
                </div>
                {event.notes ? <p className="mt-3 text-sm text-slate">{event.notes}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

function SummaryRow({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">{label}</p>
      <div className="text-sm leading-6">{value}</div>
    </div>
  );
}
