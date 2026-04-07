import { storeRepository } from "@/lib/repositories/storeRepository";
import { Asset } from "@/lib/types";

export class AssetRepository {
  async list(): Promise<Asset[]> {
    const store = await storeRepository.getStore();
    return [...store.assets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<Asset | null> {
    const store = await storeRepository.getStore();
    return store.assets.find((asset) => asset.id === id) ?? null;
  }

  async create(asset: Asset): Promise<Asset> {
    const store = await storeRepository.getStore();
    store.assets.push(asset);
    await storeRepository.saveStore(store);
    return asset;
  }

  async update(asset: Asset): Promise<Asset> {
    const store = await storeRepository.getStore();
    const index = store.assets.findIndex((item) => item.id === asset.id);

    if (index === -1) {
      throw new Error(`Asset not found: ${asset.id}`);
    }

    store.assets[index] = asset;
    await storeRepository.saveStore(store);
    return asset;
  }
}

export const assetRepository = new AssetRepository();
