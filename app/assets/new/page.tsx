import { CreateAssetForm } from "@/components/forms";
import { Card, PageShell } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function NewAssetPage() {
  return (
    <PageShell
      title="Create Asset"
      description="Register a new supply-chain asset or batch, then automatically emit its initial batch creation event through the mock ledger workflow."
    >
      <Card>
        <CreateAssetForm />
      </Card>
    </PageShell>
  );
}
