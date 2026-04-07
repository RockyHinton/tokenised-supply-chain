import { documentRepository } from "@/lib/repositories/documentRepository";
import { storeRepository } from "@/lib/repositories/storeRepository";
import { DocumentRecord } from "@/lib/types";
import { CreateDocumentInput, createDocumentSchema } from "@/lib/validation/schemas";
import { nowIso } from "@/lib/utils/dates";

export class DocumentService {
  async listDocuments(): Promise<DocumentRecord[]> {
    return documentRepository.list();
  }

  async createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
    const parsed = createDocumentSchema.parse(input);
    const store = await storeRepository.getStore();

    const document: DocumentRecord = {
      id: storeRepository.nextId(store, "document"),
      assetId: parsed.assetId,
      eventId: parsed.eventId,
      filename: parsed.filename,
      documentType: parsed.documentType,
      hash: parsed.hash,
      createdAt: nowIso()
    };

    store.documents.push(document);
    await storeRepository.saveStore(store);

    return document;
  }
}

export const documentService = new DocumentService();
