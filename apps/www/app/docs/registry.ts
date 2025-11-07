import type { JSX } from "react";
import fs from "node:fs";
import path from "node:path";

export type MDXModule = {
  default: (props: Record<string, unknown>) => JSX.Element;
  metadata?: { title?: string } & Record<string, unknown>;
};

const DOCS_DIR = path.join(process.cwd(), "app", "docs");

function walkDocs(dir: string, base = ""): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith("[")) continue;
    if (e.isDirectory()) {
      out.push(...walkDocs(path.join(dir, e.name), path.join(base, e.name)));
    } else if (e.isFile()) {
      if (!e.name.endsWith(".mdx")) continue;
      if (e.name === "page.mdx") continue;
      const rel = path.join(base, e.name).replace(/\\/g, "/");
      out.push(rel.replace(/\.mdx$/, ""));
    }
  }
  return out;
}

export const slugs: string[] = walkDocs(DOCS_DIR);

export const pages: Record<string, () => Promise<MDXModule>> =
  Object.fromEntries(
    slugs.map((slug) => [
      slug,
      () => import(`./${slug}.mdx`) as unknown as Promise<MDXModule>,
    ])
  );

export type DocsGroup = {
  label: string;
  items: { href: string; title: string }[];
};

function titleCase(s: string) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export async function getDocsItems() {
  const items: { href: string; title: string }[] = [];
  try {
    const index = (await import("./page.mdx")) as unknown as MDXModule;
    items.push({
      href: "/docs",
      title: (index.metadata?.title as string) ?? "Overview",
    });
  } catch {
    items.push({ href: "/docs", title: "Overview" });
  }
  for (const slug of slugs) {
    try {
      const mod = (await import(`./${slug}.mdx`)) as unknown as MDXModule;
      const leaf = slug.split("/").slice(-1)[0];
      const title = (mod.metadata?.title as string) ?? leaf;
      items.push({ href: `/docs/${slug}`, title });
    } catch {
      const leaf = slug.split("/").slice(-1)[0];
      items.push({ href: `/docs/${slug}`, title: leaf });
    }
  }
  return items;
}

export async function getDocsGroups(): Promise<DocsGroup[]> {
  const items = await getDocsItems();
  const groupsMap = new Map<string, DocsGroup>();
  for (const it of items) {
    const rel = it.href.replace(/^\/docs\/?/, "");
    const first = rel.split("/")[0] || "General";
    const label = rel ? titleCase(first) : "General";
    if (!groupsMap.has(label)) groupsMap.set(label, { label, items: [] });
    groupsMap.get(label)!.items.push(it);
  }
  const groups = Array.from(groupsMap.values()).sort((a, b) => {
    if (a.label === "General") return -1;
    if (b.label === "General") return 1;
    return a.label.localeCompare(b.label);
  });
  for (const g of groups)
    g.items.sort((a, b) => a.title.localeCompare(b.title));
  return groups;
}
