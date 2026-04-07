import { readStore, writeStore } from "@/lib/db/store";
import { StoreData } from "@/lib/types";
import { formatId } from "@/lib/utils/ids";

type CounterName = keyof StoreData["meta"]["counters"];

export class StoreRepository {
  async getStore(): Promise<StoreData> {
    return readStore();
  }

  async saveStore(store: StoreData): Promise<void> {
    await writeStore(store);
  }

  nextId(store: StoreData, counter: CounterName): string {
    store.meta.counters[counter] += 1;

    const prefixMap: Record<CounterName, string> = {
      asset: "asset",
      event: "evt",
      document: "doc",
      ledger: "mlr",
      sequence: "seq"
    };

    return formatId(prefixMap[counter], store.meta.counters[counter]);
  }

  nextSequence(store: StoreData): number {
    store.meta.counters.sequence += 1;
    return store.meta.counters.sequence;
  }
}

export const storeRepository = new StoreRepository();
