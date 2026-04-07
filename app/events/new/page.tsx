import { RecordEventForm } from "@/components/forms";
import { Card, EmptyState, PageShell } from "@/components/ui";
import { assetService } from "@/lib/services/assetService";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams
}: {
  searchParams?: Promise<{ assetId?: string }>;
}) {
  const assets = await assetService.listAssets();
  const resolvedParams = searchParams ? await searchParams : undefined;

  return (
    <PageShell
      title="Record Event"
      description="Validate the next lifecycle step, prepare the HCS-style payload, submit it to the mock ledger adapter, and update local state."
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
          <RecordEventForm assets={assets} initialAssetId={resolvedParams?.assetId} />
        </Card>
      )}
    </PageShell>
  );
}
