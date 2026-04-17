import { documentRepository } from "@/lib/repositories/documentRepository";
import { idRepository } from "@/lib/repositories/idRepository";
import { DocumentRecord } from "@/lib/types";
import { CreateDocumentInput, createDocumentSchema } from "@/lib/validation/schemas";
import { nowIso } from "@/lib/utils/dates";

export class DocumentService {
  async listDocuments(): Promise<DocumentRecord[]> {
    return documentRepository.list();
  }

  async createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
    const parsed = createDocumentSchema.parse(input);

    const document: DocumentRecord = {
      id: await idRepository.nextDocumentId(),
      assetId: parsed.assetId,
      eventId: parsed.eventId,
      filename: parsed.filename,
      documentType: parsed.documentType,
      hash: parsed.hash,
      createdAt: nowIso()
    };

    return documentRepository.create(document);
  }
}

export const documentService = new DocumentService();
