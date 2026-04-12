import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, EmptyState, PageShell, SectionTitle } from "@/components/ui";
import { AssetAuditViewModel } from "@/lib/domain/assetAudit";
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
  const heroStatus = buildHeroStatus(audit);
  const nextActionHref = audit.nextAction.eventType
    ? `/events/new?assetId=${asset.id}&eventType=${audit.nextAction.eventType}`
    : `/events/new?assetId=${asset.id}`;

  return (
    <PageShell
      title={asset.assetId}
      description="A focused operational and audit view that highlights where this asset is now, whether anything needs attention, and what should happen next."
    >
      <AssetHero
        assetName={asset.name}
        stageLabel={audit.lifecycle.currentStageLabel}
        batchNumber={asset.batchNumber}
        assetType={asset.assetType}
        originSupplier={asset.originSupplier}
        status={heroStatus}
        nextAction={audit.nextAction}
        nextActionHref={nextActionHref}
      />

      <Card className="space-y-4">
        <SectionTitle
          title="Lifecycle"
          subtitle="A simplified view of recorded progression through the expected supply-chain stages."
        />
        <LifecycleTracker steps={audit.lifecycle.steps} />
        {heroStatus.warningLine ? (
          <p className="text-sm text-amber-700">{heroStatus.warningLine}</p>
        ) : null}
      </Card>

      <div className="space-y-3">
        <CollapsibleSection
          title="System Details"
          subtitle="Verification, integrity, issues, and document health behind the top-level system status."
          defaultOpen={audit.issues.length > 0}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <MetricBlock
              label="Verification"
              value={audit.verification.label}
              hint={audit.verification.description}
            />
            <MetricBlock
              label="Process Integrity"
              value={audit.processIntegrity.label}
              hint={audit.processIntegrity.description}
            />
            <MetricBlock
              label="Documents Attached"
              value={audit.documents.label}
              hint={audit.documents.description}
            />
          </div>
          <div className="mt-5 space-y-3">
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
        </CollapsibleSection>

        <CollapsibleSection title="Asset Summary" subtitle="Stored asset metadata and timestamps." defaultOpen={false}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryRow label="Asset Type" value={asset.assetType} />
            <SummaryRow label="Description" value={asset.description} />
            <SummaryRow label="Origin Supplier" value={asset.originSupplier} />
            <SummaryRow label="Batch Number" value={asset.batchNumber} />
            <SummaryRow label="Stored Stage" value={<Badge>{asset.currentStage}</Badge>} />
            <SummaryRow label="Stored Custodian" value={asset.currentCustodian} />
            <SummaryRow label="Status" value={asset.status} />
            <SummaryRow label="Created" value={formatDateTime(asset.createdAt)} />
            <SummaryRow label="Updated" value={formatDateTime(asset.updatedAt)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Chain Of Custody"
          subtitle={audit.chainOfCustody.description}
          defaultOpen={false}
        >
          <div className="rounded-2xl border border-line/80 bg-mist/30 p-4">
            <p className="text-sm font-semibold">{audit.chainOfCustody.display}</p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Linked Documents" subtitle="Evidence and references attached to this asset." defaultOpen={false}>
          <div className="space-y-3">
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
        </CollapsibleSection>

        <CollapsibleSection
          title="Latest Ledger Proof"
          subtitle="The most recent technical proof record associated with this asset."
          defaultOpen={false}
        >
          {asset.latestLedgerRecord ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <p className="text-sm text-slate">No ledger submission has been recorded yet.</p>
          )}
        </CollapsibleSection>
      </div>

      <Card className="space-y-5">
        <SectionTitle
          title="Event Timeline"
          subtitle="Detailed audit history and proof linkage for deeper review."
        />
        <div className="space-y-4">
          {audit.timeline.length === 0 ? (
            <EmptyState
              title="No lifecycle events recorded"
              description="Once events are recorded for this asset they will appear here with custody, verification, and ledger proof context."
            />
          ) : (
            audit.timeline.map((item, index) => (
              <div key={item.event.id} className="grid gap-4 md:grid-cols-[28px_1fr]">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                  {index < audit.timeline.length - 1 ? <div className="mt-2 h-full w-px bg-line" /> : null}
                </div>
                <div className="rounded-2xl border border-line/70 bg-mist/20 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold capitalize">{item.eventLabel}</p>
                      <p className="text-sm text-slate">{item.stageLabel}</p>
                    </div>
                    <div className="text-sm text-slate">{formatDateTime(item.timestampLabel)}</div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

function AssetHero({
  assetName,
  stageLabel,
  batchNumber,
  assetType,
  originSupplier,
  status,
  nextAction,
  nextActionHref
}: {
  assetName: string;
  stageLabel: string;
  batchNumber: string;
  assetType: string;
  originSupplier: string;
  status: HeroStatus;
  nextAction: AssetAuditViewModel["nextAction"];
  nextActionHref: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-line/80 bg-white/95 p-6 shadow-panel lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{stageLabel}</Badge>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">
                {assetType} · Batch {batchNumber}
              </p>
            </div>
            <div>
              <h3 className="text-3xl font-semibold tracking-tight lg:text-4xl">{assetName}</h3>
              <p className="mt-2 text-sm text-slate">Origin supplier: {originSupplier}</p>
            </div>
          </div>

          <div className={`rounded-2xl border px-4 py-4 ${status.containerClass}`}>
            <p className="text-xs font-medium uppercase tracking-[0.18em]">{status.eyebrow}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold">{status.label}</span>
              <Badge tone={status.badgeTone}>{status.badgeText}</Badge>
            </div>
            <p className="mt-2 text-sm">{status.description}</p>
            {status.reasons.length > 0 ? (
              <p className="mt-2 text-sm">{status.reasons.slice(0, 2).join(" · ")}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-mist/35 p-5 lg:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">
            Next Recommended Action
          </p>
          <h4 className="mt-3 text-2xl font-semibold tracking-tight">{nextAction.label}</h4>
          <p className="mt-2 text-sm leading-6 text-slate">{nextAction.description}</p>
          {nextAction.eventType ? (
            <div className="mt-5">
              <Link
                href={nextActionHref}
                className="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-accent"
              >
                Record Next Event
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate">
              No action is available until the current lifecycle state is complete or reconciled.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function LifecycleTracker({
  steps
}: {
  steps: Array<{
    stage: string;
    label: string;
    state: "completed" | "current" | "upcoming" | "warning";
  }>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.stage} className="relative">
            {index < steps.length - 1 ? (
              <div className="absolute left-[calc(50%+0.9rem)] top-5 hidden h-px w-[calc(100%-1.8rem)] bg-line md:block" />
            ) : null}
            <div className="rounded-2xl border border-line/70 bg-white px-4 py-4">
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
                <span className="text-sm font-medium">{step.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl2 border border-line/80 bg-white/90 shadow-panel"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate">{subtitle}</p> : null}
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t border-line/70 px-5 py-5">{children}</div>
    </details>
  );
}

function MetricBlock({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-line/70 bg-mist/20 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
      <p className="mt-2 text-sm text-slate">{hint}</p>
    </div>
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

type HeroStatus = {
  label: string;
  badgeText: string;
  badgeTone: "default" | "success" | "warning";
  eyebrow: string;
  description: string;
  reasons: string[];
  warningLine: string | null;
  containerClass: string;
};

function buildHeroStatus(audit: AssetAuditViewModel): HeroStatus {
  const reasons =
    audit.issues.length > 0
      ? audit.issues.map((issue) => issue.label)
      : audit.verification.status === "incomplete"
        ? [audit.verification.label]
        : [];

  if (audit.issues.length > 0) {
    return {
      label: "Issue",
      badgeText: "Issue",
      badgeTone: "warning",
      eyebrow: "System Status",
      description:
        audit.processIntegrity.status === "stage_gap_detected"
          ? "The asset history needs attention before the lifecycle can be treated as clean."
          : "The asset has active operational or audit issues that should be reviewed.",
      reasons,
      warningLine: reasons[0] ? `Attention needed: ${reasons.slice(0, 2).join(" · ")}` : null,
      containerClass: "border-amber-200 bg-amber-50 text-amber-900"
    };
  }

  if (audit.verification.status === "incomplete") {
    return {
      label: "Warning",
      badgeText: "Warning",
      badgeTone: "warning",
      eyebrow: "System Status",
      description: "The lifecycle is progressing, but verification evidence is still incomplete.",
      reasons: [audit.documents.description],
      warningLine: audit.documents.description,
      containerClass: "border-amber-200 bg-amber-50 text-amber-900"
    };
  }

  return {
    label: "Valid",
    badgeText: "Valid",
    badgeTone: "success",
    eyebrow: "System Status",
    description: "Lifecycle, verification, and evidence all look consistent for the current stage.",
    reasons: [],
    warningLine: null,
    containerClass: "border-emerald-200 bg-emerald-50 text-emerald-900"
  };
}
