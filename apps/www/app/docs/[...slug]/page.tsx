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
  if (!mod.metadata) return {};

  const title = mod.metadata.title as string;
  const description = mod.metadata.description as string;
  if (!mod.metadata) return {};
  const metadata = mod.metadata;
  const ogImage = `/api/og?type=docs&title=${encodeURIComponent(
    String(metadata.title || "")
  )}&subtitle=${encodeURIComponent(
    String(description || "")
  )}&section=${encodeURIComponent(String(key.split("/")[0] || ""))}`;
  return title
    ? {
        title,
        description: description,

        openGraph: {
          title: metadata.title,
          description: description,
          url: `https://www.audexis.app/docs/${key}`,
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: String(metadata.title || "Audexis Docs"),
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: String(metadata.title || ""),
          description: String(description || ""),
          images: [ogImage],
        },
      }
    : {};
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
