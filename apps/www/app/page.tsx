import { getLatestRelease } from "@/lib/github";
import { DownloadButton } from "@/components/DownloadButton";
import Link from "next/link";

import Screenshot from "@/components/Screenshot";
import Script from "next/script";

export default async function Home() {
  const release = await getLatestRelease();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Audexis",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "macOS 11.0 or later",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, album art, track information, and more with ease.",
    softwareVersion: release?.tag_name || "alpha",
    datePublished: release?.published_at || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: "Kp Adeyinka",
    },
    downloadUrl: release?.assets.find((a) => a.name.endsWith(".dmg"))
      ?.browser_download_url,
    screenshot: "https://www.audexis.app/screenshot.png",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-background">
        <section className="flex flex-row  px-4 py-20 md:py-32">
          <div className="max-w-4xl mt-18  space--6">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
              Audio Metadata
              <br />
              <span className="text-primary">Simplified</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A powerful and intuitive audio metadata editor for macOS and
              Windows. Edit ID3 tags, manage album art, batch rename files, and
              organize your music library with ease.
            </p>

            <div className="flex i  flex-col sm:flex-row item-center gap-4 mt-8">
              <DownloadButton release={release} />
              <div>
                <Link
                  href="/docs"
                  className="inline-flex  gap-2 rounded-lg border border-border px-8 py-4 text-lg font-semibold transition-colors hover:bg-muted"
                >
                  View Documentation
                </Link>
              </div>
            </div>
          </div>
          <div className="flex-1  flex">
            <div className="ml-auto pl-12">
              <Screenshot />
            </div>
          </div>
        </section>

        <section className="px-4 py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything You Need
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to make audio metadata editing fast,
                efficient, and enjoyable.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-3 p-6 bg-background rounded-lg border border-border">
                <div className="rounded-full bg-primary/10 p-3 w-fit">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Batch Editing
                </h3>
                <p className="text-sm text-muted-foreground">
                  Edit metadata for multiple audio files simultaneously. Update
                  artist, album, genre, and more across your entire library in
                  seconds.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 bg-background rounded-lg border border-border">
                <div className="rounded-full bg-primary/10 p-3 w-fit">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Album Art Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add, edit, and remove album artwork with drag-and-drop
                  simplicity. Supports high-resolution cover images for your
                  music collection.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 bg-background rounded-lg border border-border">
                <div className="rounded-full bg-primary/10 p-3 w-fit">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Pattern-Based Renaming
                </h3>
                <p className="text-sm text-muted-foreground">
                  Rename files using flexible patterns based on metadata tags.
                  Create consistent naming schemes like &quot;Artist -
                  Title&quot; or &quot;Album/Track Number - Song&quot;.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 bg-background rounded-lg border border-border">
                <div className="rounded-full bg-primary/10 p-3 w-fit">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Find & Replace
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quickly search and replace text across all metadata fields.
                  Perfect for fixing typos or updating information across
                  multiple files.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 bg-background rounded-lg border border-border">
                <div className="rounded-full bg-primary/10 p-3 w-fit">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Customizable Interface
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tailor the workspace to your needs. Show or hide columns,
                  adjust layouts, and switch between light and dark themes.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 bg-background rounded-lg border border-border">
                <div className="rounded-full bg-primary/10 p-3 w-fit">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Fast & Native
                </h3>
                <p className="text-sm text-muted-foreground">
                  Built with Tauri and Rust for blazing-fast performance. Native
                  macOS experience with minimal resource usage.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Supports Your Music Library
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Works with the most popular audio formats
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-muted rounded-lg border border-border">
                <span className="font-semibold text-foreground">MP3</span>
              </div>
              <div className="px-6 py-3 bg-muted rounded-lg border border-border">
                <span className="font-semibold text-foreground">M4A</span>
              </div>
              <div className="px-6 py-3 bg-muted rounded-lg border border-border">
                <span className="font-semibold text-foreground">MP4</span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground">
              Download Audexis today and take control of your music library.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <DownloadButton release={release} />
              <a
                href="https://github.com/kp-fyn/audexis"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-4 text-lg font-semibold transition-colors hover:bg-muted"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
