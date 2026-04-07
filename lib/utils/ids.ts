export function formatId(prefix: string, value: number): string {
  return `${prefix}_${value.toString().padStart(6, "0")}`;
}
