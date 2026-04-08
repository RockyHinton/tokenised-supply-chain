import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, EmptyState, PageShell, SectionTitle } from "@/components/ui";
import { assetService } from "@/lib/services/assetService";
import { formatDateTime } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const detail = await assetService.getAssetDetailView(assetId);

  if (!detail) {
    notFound();
  }

  const { asset, audit } = detail;
  const nextActionHref = audit.nextAction.eventType
    ? `/events/new?assetId=${asset.id}&eventType=${audit.nextAction.eventType}`
    : `/events/new?assetId=${asset.id}`;

  return (
    <PageShell
      title={asset.assetId}
      description="A lifecycle-first operational and audit view for this asset, combining progress, verification quality, process integrity, chain of custody, and ledger proof references."
      actions={
        <Link
          href={nextActionHref}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent"
        >
          Record Next Event
        </Link>
      }
    >
      <Card className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">
              Lifecycle Progress
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">{asset.name}</h3>
            <p className="mt-1 text-sm text-slate">
              {asset.assetType} · Batch {asset.batchNumber} · Origin {asset.originSupplier}
            </p>
          </div>
          <div className="max-w-md rounded-2xl border border-line bg-mist/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">
              Next Recommended Action
            </p>
            <p className="mt-2 text-sm font-semibold">{audit.nextAction.label}</p>
            <p className="mt-1 text-sm text-slate">{audit.nextAction.description}</p>
          </div>
        </div>
        <LifecycleTracker
          steps={audit.lifecycle.steps}
          integrityLabel={audit.processIntegrity.label}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatusCard
          title="Current Stage"
          value={audit.lifecycle.currentStageLabel}
          description={
            audit.hasStateMismatch
              ? "Derived from event history and currently in conflict with stored asset state."
              : "Derived from the latest recorded lifecycle transition."
          }
        />
        <StatusCard
          title="Current Custodian"
          value={audit.derivedCurrentCustodian ?? "Unknown"}
          description="Latest responsible custodian derived from the event history."
        />
        <StatusCard
          title="Verification Status"
          value={audit.verification.label}
          description={audit.verification.description}
          tone={audit.verification.status === "verified" ? "success" : "warning"}
        />
        <StatusCard
          title="Process Integrity"
          value={audit.processIntegrity.label}
          description={audit.processIntegrity.description}
          tone={audit.processIntegrity.status === "valid" ? "success" : "warning"}
        />
        <StatusCard
          title="Documents Attached"
          value={audit.documents.label}
          description={audit.documents.description}
          tone={audit.documents.requiredDocumentHashMissing ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <SectionTitle title="Asset Summary" />
          <SummaryRow label="Asset Type" value={asset.assetType} />
          <SummaryRow label="Description" value={asset.description} />
          <SummaryRow label="Origin Supplier" value={asset.originSupplier} />
          <SummaryRow label="Stored Stage" value={<Badge>{asset.currentStage}</Badge>} />
          <SummaryRow label="Stored Custodian" value={asset.currentCustodian} />
          <SummaryRow label="Status" value={asset.status} />
          <SummaryRow label="Created" value={formatDateTime(asset.createdAt)} />
          <SummaryRow label="Updated" value={formatDateTime(asset.updatedAt)} />
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle title="Issues & Risk Flags" />
            <div className="mt-4 space-y-3">
              {audit.issues.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                  No active issues detected.
                </div>
              ) : (
                audit.issues.map((issue) => (
                  <div key={issue.code} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">{issue.label}</p>
                    <p className="mt-1 text-sm text-amber-800">{issue.description}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Chain Of Custody" subtitle={audit.chainOfCustody.description} />
            <div className="mt-4 rounded-2xl border border-line/80 bg-mist/30 p-4">
              <p className="text-sm font-semibold">{audit.chainOfCustody.display}</p>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Latest Ledger Proof" />
            {asset.latestLedgerRecord ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <SummaryRow label="Ledger Record ID" value={asset.latestLedgerRecord.ledgerRecordId} />
                  <SummaryRow label="Topic ID" value={asset.latestLedgerRecord.topicId} />
                  <SummaryRow label="Sequence" value={asset.latestLedgerRecord.sequenceNumber} />
                  <SummaryRow
                    label="Consensus Time"
                    value={formatDateTime(asset.latestLedgerRecord.consensusTimestamp)}
                  />
                </div>
                <Link
                  href={`/ledger/mock/${asset.latestLedgerRecord.ledgerRecordId}`}
                  className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
                >
                  View Ledger Proof
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate">No ledger submission has been recorded yet.</p>
            )}
          </Card>
        </div>
      </div>

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

      <Card>
        <SectionTitle
          title="Event Timeline"
          subtitle="A business-readable audit trail linking each lifecycle event to technical ledger proof."
        />
        <div className="mt-6 space-y-4">
          {audit.timeline.length === 0 ? (
            <EmptyState
              title="No lifecycle events recorded"
              description="Once events are recorded for this asset they will appear here with custody, verification, and ledger proof context."
            />
          ) : (
            audit.timeline.map((item, index) => (
              <div key={item.event.id} className="grid gap-4 md:grid-cols-[32px_1fr]">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-accent" />
                  {index < audit.timeline.length - 1 ? <div className="mt-2 h-full w-px bg-line" /> : null}
                </div>
                <div className="rounded-2xl border border-line/80 bg-mist/30 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-semibold capitalize">{item.eventLabel}</p>
                      <p className="mt-1 text-sm text-slate">{item.stageLabel}</p>
                    </div>
                    <div className="text-sm text-slate">{formatDateTime(item.timestampLabel)}</div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryRow label="Actor" value={item.actorLabel} />
                    <SummaryRow label="Location" value={item.locationLabel} />
                    <SummaryRow label="Custody Change" value={item.custodyLabel} />
                    <SummaryRow
                      label="Document Status"
                      value={<Badge tone={item.documentStatus.tone}>{item.documentStatus.label}</Badge>}
                    />
                  </div>
                  {item.event.notes ? <p className="mt-4 text-sm text-slate">{item.event.notes}</p> : null}
                  <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-slate">
                      Ledger record: {item.ledgerRecord?.ledgerRecordId ?? "Not submitted"}
                    </p>
                    {item.ledgerHref ? (
                      <Link
                        href={item.ledgerHref}
                        className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
                      >
                        View Ledger Proof
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </PageShell>
  );
}

function LifecycleTracker({
  steps,
  integrityLabel
}: {
  steps: Array<{
    stage: string;
    label: string;
    state: "completed" | "current" | "upcoming" | "warning";
  }>;
  integrityLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.stage} className="relative">
            {index < steps.length - 1 ? (
              <div className="absolute left-[calc(50%+1rem)] top-5 hidden h-px w-[calc(100%-2rem)] bg-line md:block" />
            ) : null}
            <div className="relative rounded-2xl border border-line/80 bg-white px-4 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "h-3 w-3 rounded-full",
                    step.state === "completed" ? "bg-accent" : "",
                    step.state === "current" ? "bg-ink" : "",
                    step.state === "upcoming" ? "bg-line" : "",
                    step.state === "warning" ? "bg-amber-500" : ""
                  ].join(" ")}
                />
                <span className="text-sm font-semibold">{step.label}</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate">{step.state}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate">Integrity assessment: {integrityLabel}</p>
    </div>
  );
}

function StatusCard({
  title,
  value,
  description,
  tone = "default"
}: {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">{title}</p>
        <Badge tone={tone}>{value}</Badge>
      </div>
      <p className="text-sm text-slate">{description}</p>
    </Card>
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
