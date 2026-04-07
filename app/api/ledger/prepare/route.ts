import { NextResponse } from "next/server";

import { ledgerService } from "@/lib/services/ledgerService";
import { storeRepository } from "@/lib/repositories/storeRepository";
import { prepareLedgerSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/utils/api";
import { formatId } from "@/lib/utils/ids";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = prepareLedgerSchema.parse(await request.json());
    const store = await storeRepository.getStore();
    const asset = store.assets.find((item) => item.id === body.assetId);

    if (!asset) {
      throw new Error("Asset not found.");
    }

    const eventId = formatId("evt", store.meta.counters.event + 1);
    const documentId = formatId("doc", store.meta.counters.document + 1);
    const documents = body.documentHash
      ? [
          {
            id: documentId,
            assetId: asset.id,
            eventId,
            filename: body.documentFilename || `${body.eventType}-document.txt`,
            documentType: body.documentType || "supporting_document",
            hash: body.documentHash,
            createdAt: new Date().toISOString()
          }
        ]
      : [];

    const payload = ledgerService.prepareSubmission({
      asset,
      event: {
        id: eventId,
        assetId: asset.id,
        eventType: body.eventType,
        actorId: body.actorId,
        actorRole: body.actorRole,
        fromStage: body.fromStage,
        toStage: body.toStage,
        fromCustodian: body.fromCustodian ?? null,
        toCustodian: body.toCustodian ?? null,
        locationName: body.locationName ?? null,
        notes: body.notes ?? null,
        documentHash: body.documentHash ?? null,
        appTimestamp: new Date().toISOString()
      },
      documents
    });

    return NextResponse.json({ data: payload });
  } catch (error) {
    return handleApiError(error);
  }
}
