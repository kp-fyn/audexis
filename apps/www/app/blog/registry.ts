// I realized that i should have just moved most of the files to (blogPages) but its too late now. u live n ya learn
import type { JSX } from "react";
import fs from "node:fs";
import path from "node:path";

export type MDXModule = {
  default: (props: Record<string, unknown>) => JSX.Element;
  metadata: { title: string; description: string; date: number };
};

const DOCS_DIR = path.join(process.cwd(), "app", "blog");

function walkBlog(dir: string, base = ""): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith("[")) continue;

    if (e.isDirectory()) {
      out.push(...walkBlog(path.join(dir, e.name), path.join(base, e.name)));
    } else if (e.isFile()) {
      if (!e.name.endsWith(".mdx")) continue;
      if (e.name === "page.mdx") continue;
      const rel = path.join(base, e.name).replace(/\\/g, "/");
      const ez = rel.replace(/\.mdx$/, "");
      const newSlug = ez.split("(blogPages)/");

      out.push(newSlug.length === 1 ? newSlug[0] : newSlug[1]);
    }
  }
  return out;
}

export const slugs: string[] = walkBlog(DOCS_DIR);

export const pages: Record<string, () => Promise<MDXModule>> =
  Object.fromEntries(
    slugs.map((slug) => [
      slug,
      () =>
        import(`./(blogPages)/${slug}.mdx`) as unknown as Promise<MDXModule>,
    ])
  );

export type BlogGroup = {
  label: string;
  items: {
    href: string;
    title: string;
    description: string;
    readingTime: number;
    date: number;
  }[];
};

function mdxToPlainText(src: string): string {
  let text = src;

  text = text.replace(/^---[\s\S]*?---\n/, "");

  text = text.replace(/^(import|export).*$\n?/gm, "");

  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]*`/g, " ");

  text = text.replace(/<\/?[^>]+>/g, " ");

  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, " ");
  text = text.replace(/\[[^\]]*]\([^)]*\)/g, (m) => {
    const inner = m.match(/\[([^\]]*)]/);
    return inner ? inner[1] : " ";
  });

  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}[-*+]\s+/gm, "");
  text = text.replace(/^\s{0,3}\d+\.\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s+/gm, "");
  text = text.replace(/^\s*-{3,}\s*$/gm, " ");

  text = text.replace(/\s+/g, " ").trim();

  return text;
}

function calcReadingTime(text: string, wpm = 200): number {
  if (!text) return 1;
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / wpm));
  return minutes;
}

export async function getBlogItems() {
  const items: {
    href: string;
    title: string;
    description: string;
    readingTime: number;
    date: number;
  }[] = [];

  for (const slug of slugs) {
    try {
      const mod = (await import(
        `./(blogPages)/${slug}.mdx`
      )) as unknown as MDXModule;

      const leaf = slug.split("/").slice(-1)[0];
      const title = (mod.metadata?.title as string) ?? leaf;
      const description = mod.metadata.description;

      const mdxPath = path.join(DOCS_DIR, "(blogPages)", `${slug}.mdx`);
      let readingTime: number;
      try {
        const src = fs.readFileSync(mdxPath, "utf8");
        const text = mdxToPlainText(src);
        readingTime = calcReadingTime(text);
      } catch {
        readingTime = 3;
      }

      items.push({
        href: `/blog/${slug}`,
        title,
        date: mod.metadata.date,
        description: description ?? "Blog",
        readingTime,
      });
    } catch {
      const leaf = slug.split("/").slice(-1)[0];
      let readingTime: number;
      try {
        const mdxPath = path.join(DOCS_DIR, "(blogPages)", `${slug}.mdx`);
        const src = fs.readFileSync(mdxPath, "utf8");
        const text = mdxToPlainText(src);
        readingTime = calcReadingTime(text);
      } catch {
        readingTime = 3;
      }

      items.push({
        href: `/blog/${slug}`,
        title: leaf,
        description: "Blog",
        readingTime,
        date: Date.now(),
      });
    }
  }
  return items;
}

export async function getBlogGroups(): Promise<BlogGroup[]> {
  const items = await getBlogItems();
  const groupsMap = new Map<string, BlogGroup>();
  for (const it of items) {
    const rel = it.href.replace(/^\/blog\/?/, "");
    const first = rel.split("/")[0] || "Blog";
    let label = "Blog";
    if (label === "(BlogPages)") {
      label = "Blog";
    }

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
