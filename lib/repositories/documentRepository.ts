import { storeRepository } from "@/lib/repositories/storeRepository";
import { DocumentRecord } from "@/lib/types";

export class DocumentRepository {
  async list(): Promise<DocumentRecord[]> {
    const store = await storeRepository.getStore();
    return [...store.documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listByAssetId(assetId: string): Promise<DocumentRecord[]> {
    const store = await storeRepository.getStore();
    return store.documents
      .filter((document) => document.assetId === assetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(document: DocumentRecord): Promise<DocumentRecord> {
    const store = await storeRepository.getStore();
    store.documents.push(document);
    await storeRepository.saveStore(store);
    return document;
  }
}

export const documentRepository = new DocumentRepository();
