import { eq } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import { ensureDatabaseSeeded } from "@/lib/db/seedRuntime";
import { users } from "@/lib/db/schema";
import { nowIso } from "@/lib/utils/dates";

type DbExecutor = DbClient;

function resolveExecutor(executor?: DbExecutor) {
  return executor ?? getDb();
}

export class UserRepository {
  async list(executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    return resolveExecutor(executor).select().from(users);
  }

  async getById(id: string, executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    return resolveExecutor(executor).query.users.findFirst({
      where: eq(users.id, id)
    });
  }

  async ensureUser(input: {
    id: string;
    organisationId: string;
    role: string;
  }, executor?: DbExecutor) {
    await ensureDatabaseSeeded(executor);

    const db = resolveExecutor(executor);
    const existing = await db.query.users.findFirst({
      where: eq(users.id, input.id)
    });

    if (existing) {
      return existing;
    }

    const timestamp = nowIso();
    const [created] = await db
      .insert(users)
      .values({
        id: input.id,
        organisationId: input.organisationId,
        name: input.id.replaceAll("_", " "),
        email: `${input.id}@example.local`,
        role: input.role,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    return created;
  }
}

export const userRepository = new UserRepository();
