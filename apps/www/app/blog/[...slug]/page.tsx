import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pages, slugs } from "../registry";
import Head from "next/head";

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

  if (!mod.metadata) return {};
  const metadata = mod.metadata;
  return {
    title,
    description: metadata.description,

    alternates: {
      canonical: `https://www.audexis.app/blog/${key}`,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      modifiedTime: new Date(metadata.date).toISOString(),
      url: `https://www.audexis.app/blog/${key}`,
      type: "article",
    },
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const key = (slug || []).join("/");

  const loader = pages[key];
  if (!loader) notFound();
  const mod = await loader();
  const MDX = mod.default;
  return (
    <>
      <article className="prose max-w-none dark:prose-invert">
        <MDX />
      </article>
    </>
  );
}
