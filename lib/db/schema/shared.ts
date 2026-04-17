import { varchar } from "drizzle-orm/pg-core";

export const idColumn = (name = "id", length = 64) =>
  varchar(name, { length }).primaryKey();

export const createdAtColumn = () =>
  varchar("created_at", { length: 64 }).notNull();

export const updatedAtColumn = () =>
  varchar("updated_at", { length: 64 }).notNull();
