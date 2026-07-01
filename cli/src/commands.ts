import {
  loadConfig,
  saveConfig,
  configPath,
  writeLorerc,
  removeLorerc,
  findLorerc,
  readLorercProject,
  type LoreConfig,
} from "./config.js";
import {
  graphql,
  resolveProjectId,
  resolveNodeId,
  fetchOrganization,
  listProjects,
  createProject,
} from "./client.js";
import { prompt } from "./prompt.js";

const DEFAULT_API_URL = "http://localhost:3030/graphql";

function mcpSnippet(config: LoreConfig): string {
  const snippet = {
    mcpServers: {
      sharedlore: {
        command: "npx",
        args: ["-y", "@sharedlore/mcp"],
        env: {
          LORE_API_URL: config.apiUrl,
          LORE_API_TOKEN: config.apiToken || "lore_sk_xxx",
        },
      },
    },
  };
  return JSON.stringify(snippet, null, 2);
}

export async function login(args: Map<string, string>): Promise<void> {
  const existing = loadConfig();

  let token = args.get("token") ?? "";
  if (!token) {
    token = await prompt(
      "Paste your SharedLore API token (lore_sk_...) from the dashboard > API tokens: ",
    );
  }
  if (!token.startsWith("lore_sk_")) {
    throw new Error("That does not look like a lore_sk_... token. Aborting.");
  }

  let apiUrl = args.get("api-url") ?? existing.apiUrl;
  if (!args.has("api-url")) {
    const answer = await prompt(`API URL [${apiUrl || DEFAULT_API_URL}]: `);
    if (answer) apiUrl = answer;
  }
  if (!apiUrl) apiUrl = DEFAULT_API_URL;

  const config: LoreConfig = {
    apiUrl,
    apiToken: token,
    defaultProject: "",
    organization: "",
  };

  try {
    const me = await graphql<{ me: { email: string; name: string | null } }>(
      config,
      `query { me { email name } }`,
    );
    const who = me.me.name ?? me.me.email;
    console.log(`Token verified - logged in as ${who}.`);
  } catch (err) {
    console.warn(`Warning: could not verify the token (${(err as Error).message}). Saving anyway.`);
  }

  const path = saveConfig(config);
  console.log(`Saved credentials to ${path}`);
  console.log("");
  console.log("Add this MCP server to Claude Code / Cursor (.mcp.json):");
  console.log("");
  console.log(mcpSnippet(config));
  if (!readLorercProject()) {
    console.log("");
    console.log(
      "Next: run `lore link <project-slug>` in your repo to write a .lorerc linking it to a SharedLore project.",
    );
  }
}

export async function link(args: string[]): Promise<void> {
  const slug = (args[0] ?? "").trim();
  if (!slug) throw new Error("Usage: lore link <project-slug>");

  const config = loadConfig();
  const project = await resolveProjectId(config, slug);

  const path = writeLorerc(project.slug);
  console.log(`Linked this repo to project: ${project.slug} (id ${project.id}).`);
  console.log(`Wrote ${path}. Commit it so your teammates share the same link.`);
}

export async function init(): Promise<void> {
  const config = loadConfig();

  const org = await fetchOrganization(config);
  if (!org) {
    throw new Error(
      "Could not determine your organization from the token. Run `lore login` and try again.",
    );
  }
  console.log(`Organization: ${org.name} (${org.slug})\n`);

  const projects = await listProjects(config);
  if (projects.length) {
    console.log("Projects in this organization:");
    projects.forEach((p, i) => console.log(`  ${i + 1}. ${p.slug}  -  ${p.name}`));
  } else {
    console.log("No projects yet in this organization.");
  }
  console.log(`  n. Create a new project\n`);

  const answer = (
    await prompt("Pick a project by number, or 'n' to create a new one: ")
  ).trim();

  let slug: string;
  if (answer.toLowerCase() === "n" || projects.length === 0) {
    const name = (await prompt("New project name: ")).trim();
    if (!name) throw new Error("A project name is required.");
    const created = await createProject(config, name);
    console.log(`Created project ${created.slug} - ${created.name}.`);
    slug = created.slug;
  } else {
    const index = Number.parseInt(answer, 10) - 1;
    const picked = projects[index];
    if (!picked) throw new Error(`"${answer}" is not a valid choice.`);
    slug = picked.slug;
  }

  const path = writeLorerc(slug, org.slug);
  console.log(`\nLinked this repo to project: ${slug} (org ${org.slug}).`);
  console.log(`Wrote ${path}. Commit it so your teammates share the same link.`);
  console.log("`/lore:start` and `/lore:capture` will now use this project.");
}

export async function unlink(): Promise<void> {
  const removed = removeLorerc();
  if (!removed) {
    console.log("No .lorerc found in this directory or any parent. Nothing to unlink.");
    return;
  }
  console.log(`Removed ${removed}.`);
}

export async function capture(args: string[], flags: Map<string, string>): Promise<void> {
  const body = (args[0] ?? "").trim();
  if (!body) throw new Error('Usage: lore capture "<body>" [--node <path>] [--summary <s>]');

  const config = loadConfig();
  const project = await resolveProjectId(config, flags.get("project"));
  const nodePath = flags.get("node");
  if (!nodePath) {
    throw new Error("A node is required. Pass --node <path> (e.g. --node bot/exits).");
  }
  const nodeId = await resolveNodeId(config, project.id, nodePath);
  const summary = flags.get("summary");

  const data = await graphql<{
    captureSession: {
      session: { id: string; capturedAt: string; node: { path: string; title: string } | null };
    };
  }>(
    config,
    `mutation Capture($input: CaptureSessionInput!) {
      captureSession(input: $input) {
        session { id capturedAt node { path title } }
      }
    }`,
    { input: { projectId: project.id, nodeId, body, summary } },
  );

  const s = data.captureSession.session;
  const where = s.node ? `${s.node.title} [${s.node.path}]` : `node ${nodeId}`;
  console.log(`Captured session ${s.id} on ${where} at ${s.capturedAt.slice(0, 19)}.`);
  console.log("Context synthesis triggered server-side.");
}

export async function start(args: string[], flags: Map<string, string>): Promise<void> {
  const directive = args.join(" ").trim();
  const config = loadConfig();
  const project = await resolveProjectId(config, flags.get("project"));

  const data = await graphql<{
    briefing: {
      contexts: Array<{ path: string; title: string; body: string | null }>;
      recentSessions: Array<{
        summary: string | null;
        body: string;
        capturedAt: string;
        author: { name: string | null; email: string };
        node: { path: string } | null;
      }>;
    };
  }>(
    config,
    `query Briefing($projectId: ID!) {
      briefing(projectId: $projectId) {
        contexts { path title body }
        recentSessions {
          summary body capturedAt
          author { name email }
          node { path }
        }
      }
    }`,
    { projectId: project.id },
  );

  const { briefing } = data;
  if (directive) console.log(`Directive: ${directive}\n`);
  console.log(`# Briefing for ${project.slug}\n`);

  console.log("## Area context");
  if (briefing.contexts.length === 0) {
    console.log("(no context docs yet)");
  } else {
    for (const ctx of briefing.contexts) {
      console.log(`\n### ${ctx.title}  [${ctx.path}]`);
      if (ctx.body) console.log(truncate(ctx.body, 600));
    }
  }

  console.log("\n## Recent captures");
  if (briefing.recentSessions.length === 0) {
    console.log("(no recent sessions)");
  } else {
    for (const s of briefing.recentSessions) {
      const who = s.author.name ?? s.author.email;
      const where = s.node?.path ? ` @ ${s.node.path}` : "";
      console.log(`\n- [${s.capturedAt.slice(0, 10)}] ${who}${where}`);
      console.log(`  ${truncate(s.summary ?? s.body, 300)}`);
    }
  }
}

export async function whoami(): Promise<void> {
  const config = loadConfig();
  const data = await graphql<{
    me: {
      email: string;
      name: string | null;
      organizations: Array<{ slug: string; name: string }>;
    };
  }>(
    config,
    `query { me { email name organizations { slug name } } }`,
  );

  const me = data.me;
  console.log(`${me.name ?? "(no name)"} <${me.email}>`);
  if (me.organizations.length) {
    console.log(`Organizations: ${me.organizations.map((o) => o.slug).join(", ")}`);
  }
  const lorercPath = findLorerc();
  if (lorercPath) {
    console.log(`Linked project: ${config.defaultProject} (from ${lorercPath})`);
  } else if (config.defaultProject) {
    console.log(`Linked project: ${config.defaultProject} (from env/config)`);
  } else {
    console.log("No linked project - run `lore link <project-slug>` in your repo.");
  }
  console.log(`Config: ${configPath()}`);
}

function truncate(text: string, max: number): string {
  const clean = text.trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
