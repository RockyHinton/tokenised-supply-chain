import { eq, inArray } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { ensureDatabaseSeeded } from "@/lib/db/seedRuntime";
import { organisations } from "@/lib/db/schema";
import { nowIso } from "@/lib/utils/dates";
import { sha256 } from "@/lib/utils/hashes";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

function buildOrganisationId(name: string) {
  return `org_${sha256(name).slice(0, 8)}`;
}

export class OrganisationRepository {
  async list(executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    return resolveExecutor(executor).select().from(organisations);
  }

  async getById(id: string, executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    return resolveExecutor(executor).query.organisations.findFirst({
      where: eq(organisations.id, id)
    });
  }

  async getByIds(ids: string[], executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    if (ids.length === 0) {
      return [];
    }

    return resolveExecutor(executor)
      .select()
      .from(organisations)
      .where(inArray(organisations.id, [...new Set(ids)]));
  }

  async ensureOrganisation(input: {
    id?: string | null;
    name: string;
    type?: string;
  }, executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    const db = resolveExecutor(executor);
    const organisationId = input.id?.trim() || buildOrganisationId(input.name);
    const existing = await db.query.organisations.findFirst({
      where: eq(organisations.id, organisationId)
    });

    if (existing) {
      return existing;
    }

    const timestamp = nowIso();
    const [created] = await db
      .insert(organisations)
      .values({
        id: organisationId,
        name: input.name,
        type: input.type ?? "participant",
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    return created;
  }
}

export const organisationRepository = new OrganisationRepository();
