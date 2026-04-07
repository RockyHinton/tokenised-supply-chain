import { createHash } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function prefixedSha256(input: string): string {
  return `sha256:${sha256(input)}`;
}
