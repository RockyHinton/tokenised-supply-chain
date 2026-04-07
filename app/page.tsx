import Link from "next/link";

import { Card, PageShell, SectionTitle, StatCard } from "@/components/ui";
import { assetService } from "@/lib/services/assetService";
import { eventService } from "@/lib/services/eventService";
import { ledgerService } from "@/lib/services/ledgerService";
import { formatDateTime } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [summary, records] = await Promise.all([
    assetService.getDashboardSummary(),
    ledgerService.listRecords()
  ]);

  return (
    <PageShell
      title="Dashboard"
      description="Monitor asset throughput, recent provenance activity, and current lifecycle distribution at a glance."
      actions={
        <div className="flex gap-3">
          <Link
            href="/assets/new"
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent"
          >
            Create Asset
          </Link>
          <Link
            href="/events/new"
            className="rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent"
          >
            Record Event
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Assets" value={summary.totalAssets} />
        <StatCard label="Total Events" value={summary.totalEvents} />
        <StatCard
          label="Mock Topic"
          value="0.0.5001"
          hint="Static V1 topic for simulated HCS submissions"
        />
        <StatCard
          label="Latest Sequence"
          value={records[0]?.sequenceNumber ?? "No submissions yet"}
          hint={records[0] ? `Latest ledger record: ${records[0].ledgerRecordId}` : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <SectionTitle
            title="Latest Events"
            subtitle="The five most recent lifecycle events recorded by the application."
          />
          <div className="mt-5 space-y-4">
            {summary.latestEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-2xl border border-line/80 bg-mist/40 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{event.eventType}</p>
                  <p className="text-sm text-slate">
                    {event.assetId} · {event.actorId} · {event.toStage}
                  </p>
                </div>
                <div className="text-sm text-slate">{formatDateTime(event.appTimestamp)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Assets by Current Stage"
            subtitle="Operational distribution across the fixed V1 lifecycle."
          />
          <div className="mt-5 space-y-3">
            {summary.assetsByStage.map((entry) => (
              <div
                key={entry.stage}
                className="flex items-center justify-between rounded-2xl border border-line/80 px-4 py-3"
              >
                <span className="text-sm font-medium capitalize">{entry.stage}</span>
                <span className="text-sm text-slate">{entry.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
