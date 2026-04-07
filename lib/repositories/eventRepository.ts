import { storeRepository } from "@/lib/repositories/storeRepository";
import { EventRecord } from "@/lib/types";

export class EventRepository {
  async list(): Promise<EventRecord[]> {
    const store = await storeRepository.getStore();
    return [...store.events].sort((a, b) => b.appTimestamp.localeCompare(a.appTimestamp));
  }

  async getById(id: string): Promise<EventRecord | null> {
    const store = await storeRepository.getStore();
    return store.events.find((event) => event.id === id) ?? null;
  }

  async listByAssetId(assetId: string): Promise<EventRecord[]> {
    const store = await storeRepository.getStore();
    return store.events
      .filter((event) => event.assetId === assetId)
      .sort((a, b) => a.appTimestamp.localeCompare(b.appTimestamp));
  }

  async create(event: EventRecord): Promise<EventRecord> {
    const store = await storeRepository.getStore();
    store.events.push(event);
    await storeRepository.saveStore(store);
    return event;
  }
}

export const eventRepository = new EventRepository();
