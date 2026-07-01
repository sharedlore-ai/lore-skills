#!/usr/bin/env node
import { login, init, link, unlink, capture, start, whoami } from "./commands.js";

const HELP = `lore - the SharedLore CLI

Usage:
  lore login [--token <lore_sk_...>] [--api-url <url>]   Save your API token + API URL, print the .mcp.json snippet
  lore init                                              Interactively pick/create a project and write .lorerc
  lore link <project-slug>                               Write a .lorerc linking this repo to a project
  lore unlink                                            Remove the .lorerc from this repo
  lore capture "<body>" --node <path> [--summary <s>]    Append a session capture
  lore start [directive]                                 Print the team briefing
  lore whoami                                            Show the current user
  lore help                                              Show this help

The auth token is stored at ~/.config/sharedlore/config.json (override dir with XDG_CONFIG_HOME).
The active project comes from .lorerc in the current directory (walking up parents) - written by
\`lore link\` - falling back to the LORE_PROJECT env var.
Env vars LORE_API_URL, LORE_API_TOKEN override the config file.`;

interface ParsedArgs {
  positionals: string[];
  flags: Map<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const eq = key.indexOf("=");
      if (eq >= 0) {
        flags.set(key.slice(0, eq), key.slice(eq + 1));
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags.set(key, next);
          i++;
        } else {
          flags.set(key, "");
        }
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, flags };
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const { positionals, flags } = parseArgs(rest);

  switch (command) {
    case "login":
      await login(flags);
      break;
    case "init":
      await init();
      break;
    case "link":
      await link(positionals);
      break;
    case "unlink":
      await unlink();
      break;
    case "capture":
      await capture(positionals, flags);
      break;
    case "start":
      await start(positionals, flags);
      break;
    case "whoami":
      await whoami();
      break;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(`Error: ${(err as Error).message}`);
  process.exit(1);
});
