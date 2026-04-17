import { RecordEventForm } from "@/components/forms";
import { Card, EmptyState, PageShell } from "@/components/ui";
import { assetService } from "@/lib/services/assetService";
import { referenceDataService } from "@/lib/services/referenceDataService";
import { EVENT_TYPES, EventType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams
}: {
  searchParams?: Promise<{ assetId?: string; eventType?: string }>;
}) {
  const [assets, options] = await Promise.all([
    assetService.listAssetsForEventFlow(),
    referenceDataService.getFormOptions()
  ]);
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialEventType = EVENT_TYPES.includes(resolvedParams?.eventType as EventType)
    ? (resolvedParams?.eventType as EventType)
    : undefined;

  return (
    <PageShell
      title="Record Event"
      description="Use the guided workflow to validate the next lifecycle step, prefill current asset state, and capture only the operational inputs required for the selected event."
    >
      {assets.length === 0 ? (
        <EmptyState
          title="Create an asset first"
          description="Event recording depends on an existing asset so the service can validate the lifecycle transition."
          href="/assets/new"
          actionLabel="Create Asset"
        />
      ) : (
        <Card>
          <RecordEventForm
            assets={assets}
            options={options}
            initialAssetId={resolvedParams?.assetId}
            initialEventType={initialEventType}
          />
        </Card>
      )}
    </PageShell>
  );
}
