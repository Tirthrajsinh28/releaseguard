import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

export const exampleRoot = resolve("example-repository");

export function temporaryRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "releaseguard-test-"));
  cpSync(exampleRoot, root, { recursive: true });
  return root;
}

export function writeJson(root: string, path: string, value: unknown): void {
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
