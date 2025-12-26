import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pages, slugs } from "../registry";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  return slugs.map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const key = (slug || []).join("/");
  const loader = pages[key];
  if (!loader) return {};
  const mod = await loader();
  const title = mod.metadata?.title as string | undefined;
  return title ? { title } : {};
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const key = (slug || []).join("/");

  const loader = pages[key];
  if (!loader) notFound();
  const mod = await loader();
  const MDX = mod.default;
  return (
    <article className="prose max-w-none dark:prose-invert">
      <MDX />
    </article>
  );
}
