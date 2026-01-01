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
  const ogImage = `/api/og?type=blog&title=${encodeURIComponent(
    String(metadata.title || "")
  )}&subtitle=${encodeURIComponent(
    String(metadata.description || "")
  )}&date=${encodeURIComponent(String(metadata.date || ""))}`;
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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: String(metadata.title || "Audexis Blog"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: String(metadata.title || ""),
      description: String(metadata.description || ""),
      images: [ogImage],
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
