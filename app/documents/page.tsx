import { Card, EmptyState, PageShell } from "@/components/ui";
import { documentService } from "@/lib/services/documentService";
import { formatDateTime } from "@/lib/utils/dates";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await documentService.listDocuments();

  return (
    <PageShell
      title="Document Registry"
      description="Review all document references linked into supply-chain events so payload construction and audit tracing remain transparent."
    >
      {documents.length === 0 ? (
        <EmptyState
          title="No documents registered"
          description="Documents will appear here when certificate, shipment, or inspection records are linked to events."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-mist/60 text-slate">
                <tr>
                  {[
                    "Document ID",
                    "Asset ID",
                    "Filename",
                    "Document Type",
                    "Hash",
                    "Linked Event",
                    "Uploaded At"
                  ].map((heading) => (
                    <th key={heading} className="px-5 py-4 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id} className="border-t border-line/70">
                    <td className="px-5 py-4 font-medium">{document.id}</td>
                    <td className="px-5 py-4">{document.assetId}</td>
                    <td className="px-5 py-4">{document.filename}</td>
                    <td className="px-5 py-4">{document.documentType}</td>
                    <td className="px-5 py-4">{document.hash}</td>
                    <td className="px-5 py-4">{document.eventId}</td>
                    <td className="px-5 py-4">{formatDateTime(document.createdAt)}</td>
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
