import { homedir } from "node:os";
import { dirname, join, parse } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";

export interface LoreConfig {
  apiUrl: string;
  apiToken: string;
  defaultProject: string;
  organization: string;
}

const DEFAULT_API_URL = "https://api.sharedlore.com/graphql";

export const LORERC_FILENAME = ".lorerc";

export function configDir(): string {
  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(base, "sharedlore");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export function lorercPath(dir: string = process.cwd()): string {
  return join(dir, LORERC_FILENAME);
}

export function findLorerc(startDir: string = process.cwd()): string | undefined {
  let dir = startDir;
  const root = parse(dir).root;
  while (true) {
    const candidate = join(dir, LORERC_FILENAME);
    if (existsSync(candidate)) return candidate;
    if (dir === root) break;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

function readLorercField(field: "project" | "organization", startDir: string): string {
  const path = findLorerc(startDir);
  if (!path) return "";
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const value = parsed[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    throw new Error(`Could not parse ${path}. Expected JSON like { "organization": "<slug>", "project": "<slug>" }.`);
  }
  return "";
}

export function readLorercProject(startDir: string = process.cwd()): string {
  return readLorercField("project", startDir);
}

export function readLorercOrganization(startDir: string = process.cwd()): string {
  return readLorercField("organization", startDir);
}

export function writeLorerc(
  slug: string,
  organization?: string,
  dir: string = process.cwd(),
): string {
  const path = lorercPath(dir);
  const payload = organization ? { organization, project: slug } : { project: slug };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
  return path;
}

export function removeLorerc(dir: string = process.cwd()): string | undefined {
  const path = findLorerc(dir);
  if (!path) return undefined;
  unlinkSync(path);
  return path;
}

export function loadConfig(): LoreConfig {
  const path = configPath();
  let fromFile: Partial<LoreConfig> = {};
  if (existsSync(path)) {
    try {
      fromFile = JSON.parse(readFileSync(path, "utf8")) as Partial<LoreConfig>;
    } catch {
      throw new Error(`Could not parse config at ${path}. Delete it and run \`lore login\` again.`);
    }
  }

  return {
    apiUrl: process.env.LORE_API_URL ?? fromFile.apiUrl ?? DEFAULT_API_URL,
    apiToken: process.env.LORE_API_TOKEN ?? fromFile.apiToken ?? "",
    defaultProject: readLorercProject() || process.env.LORE_PROJECT || fromFile.defaultProject || "",
    organization: readLorercOrganization() || process.env.LORE_ORGANIZATION || "",
  };
}

export function saveConfig(config: LoreConfig): string {
  const dir = configDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const path = configPath();
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return path;
}
