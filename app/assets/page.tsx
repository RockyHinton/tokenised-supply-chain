import Link from "next/link";

import { Badge, Card, EmptyState, PageShell } from "@/components/ui";
import { assetService } from "@/lib/services/assetService";
import { formatDate } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const assets = await assetService.listAssets();

  return (
    <PageShell
      title="Assets"
      description="Track every supply-chain asset or batch, its current state, last activity, and next operational action."
    >
      {assets.length === 0 ? (
        <EmptyState
          title="No assets yet"
          description="Create your first asset to start generating provenance events and mock ledger submissions."
          href="/assets/new"
          actionLabel="Create Asset"
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-mist/60 text-slate">
                <tr>
                  {[
                    "Asset ID",
                    "Asset Type",
                    "Current Stage",
                    "Current Custodian",
                    "Created Date",
                    "Last Event Date",
                    "Status",
                    "Actions"
                  ].map((heading) => (
                    <th key={heading} className="px-5 py-4 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-t border-line/70">
                    <td className="px-5 py-4 font-medium">{asset.assetId}</td>
                    <td className="px-5 py-4">{asset.assetType}</td>
                    <td className="px-5 py-4">
                      <Badge>{asset.currentStage}</Badge>
                    </td>
                    <td className="px-5 py-4">{asset.currentCustodian}</td>
                    <td className="px-5 py-4">{formatDate(asset.createdAt)}</td>
                    <td className="px-5 py-4">
                      {asset.lastEventDate ? formatDate(asset.lastEventDate) : "N/A"}
                    </td>
                    <td className="px-5 py-4">{asset.status}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <Link href={`/assets/${asset.id}`} className="text-accent">
                          View
                        </Link>
                        <Link href={`/events/new?assetId=${asset.id}`} className="text-accent">
                          Record Event
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
