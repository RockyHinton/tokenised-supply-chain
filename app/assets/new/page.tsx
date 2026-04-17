import { CreateAssetForm } from "@/components/forms";
import { Card, PageShell } from "@/components/ui";
import { referenceDataService } from "@/lib/services/referenceDataService";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  const options = await referenceDataService.getFormOptions();

  return (
    <PageShell
      title="Create Asset"
      description="Register a new supply-chain asset or batch, then automatically emit its initial batch creation event through the mock ledger workflow."
    >
      <Card>
        <CreateAssetForm options={options} />
      </Card>
    </PageShell>
  );
}
