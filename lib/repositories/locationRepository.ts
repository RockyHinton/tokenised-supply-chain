import { eq } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { ensureDatabaseSeeded } from "@/lib/db/seedRuntime";
import { locations } from "@/lib/db/schema";
import { nowIso } from "@/lib/utils/dates";
import { sha256 } from "@/lib/utils/hashes";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

function buildLocationId(name: string) {
  return `site_${sha256(name).slice(0, 6)}`;
}

function buildLocationCode(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export class LocationRepository {
  async list(executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    return resolveExecutor(executor).select().from(locations);
  }

  async getById(id: string, executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    return resolveExecutor(executor).query.locations.findFirst({
      where: eq(locations.id, id)
    });
  }

  async ensureLocation(input: {
    name: string;
    organisationId: string;
    type?: string;
  }, executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    const db = resolveExecutor(executor);
    const locationId = buildLocationId(input.name);
    const existing = await db.query.locations.findFirst({
      where: eq(locations.id, locationId)
    });

    if (existing) {
      return existing;
    }

    const timestamp = nowIso();
    const [created] = await db
      .insert(locations)
      .values({
        id: locationId,
        organisationId: input.organisationId,
        name: input.name,
        code: buildLocationCode(input.name),
        type: input.type ?? "site",
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    return created;
  }
}

export const locationRepository = new LocationRepository();
