import type { LoreConfig } from "./config.js";

export class LoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoreError";
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function graphql<T>(
  config: LoreConfig,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  if (!config.apiToken) {
    throw new LoreError("Not logged in. Run `lore login` and paste your lore_sk_... token first.");
  }

  let res: Response;
  try {
    res = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
        // User-scoped token: the active org comes from .lorerc, sent per request.
        ...(config.organization ? { "X-Organization-Slug": config.organization } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    throw new LoreError(`Could not reach lore-api at ${config.apiUrl}: ${(err as Error).message}`);
  }

  if (res.status === 401 || res.status === 403) {
    throw new LoreError(
      `Authentication failed (HTTP ${res.status}). Your token may be invalid or revoked - run \`lore login\` again.`,
    );
  }

  let payload: GraphQLResponse<T>;
  try {
    payload = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new LoreError(`lore-api returned a non-JSON response (HTTP ${res.status}).`);
  }

  if (payload.errors?.length) {
    throw new LoreError(payload.errors.map((e) => e.message).join("; "));
  }
  if (!payload.data) {
    throw new LoreError("lore-api returned no data.");
  }
  return payload.data;
}

export async function resolveProjectId(
  config: LoreConfig,
  slug?: string,
): Promise<{ id: string; slug: string }> {
  const target = (slug ?? config.defaultProject).trim();
  if (!target) {
    throw new LoreError(
      "No project specified and none linked. Pass a slug or run `lore link <project-slug>`.",
    );
  }
  const data = await graphql<{ project: { id: string; slug: string } | null }>(
    config,
    `query ProjectId($slug: String!) { project(slug: $slug) { id slug } }`,
    { slug: target },
  );
  if (!data.project) {
    throw new LoreError(`Project "${target}" was not found in your organization.`);
  }
  return data.project;
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function fetchOrganization(
  config: LoreConfig,
): Promise<{ slug: string; name: string } | null> {
  const data = await graphql<{ organizations: Array<{ slug: string; name: string }> }>(
    config,
    `query { organizations { slug name } }`,
  );
  return data.organizations[0] ?? null;
}

export async function listProjects(
  config: LoreConfig,
): Promise<Array<{ slug: string; name: string }>> {
  const data = await graphql<{ projects: { nodes: Array<{ slug: string; name: string } | null> } }>(
    config,
    `query { projects(first: 200) { nodes { slug name } } }`,
  );
  return (data.projects.nodes ?? []).filter(
    (p): p is { slug: string; name: string } => p !== null,
  );
}

export async function createProject(
  config: LoreConfig,
  name: string,
  slug?: string,
): Promise<{ slug: string; name: string }> {
  const finalSlug = (slug?.trim() || slugify(name)).trim();
  if (!finalSlug) {
    throw new LoreError("Could not derive a slug from that name. Try a different name.");
  }
  const data = await graphql<{ createProject: { project: { slug: string; name: string } } }>(
    config,
    `mutation CreateProject($input: CreateProjectInput!) {
      createProject(input: $input) { project { slug name } }
    }`,
    { input: { name: name.trim(), slug: finalSlug } },
  );
  return data.createProject.project;
}

export async function resolveNodeId(
  config: LoreConfig,
  projectId: string,
  nodeOrPath: string,
): Promise<string> {
  const value = nodeOrPath.trim();
  if (!value) throw new LoreError("A node id or path is required.");
  if (/^\d+$/.test(value)) return value;

  const data = await graphql<{ nodeByPath: { id: string } | null }>(
    config,
    `query NodeId($projectId: ID!, $path: String!) {
      nodeByPath(projectId: $projectId, path: $path) { id }
    }`,
    { projectId, path: value },
  );
  if (!data.nodeByPath) {
    throw new LoreError(`No node found at path "${value}".`);
  }
  return data.nodeByPath.id;
}
