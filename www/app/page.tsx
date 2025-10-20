import { getLatestRelease } from "@/lib/github";
import { DownloadButton } from "@/components/DownloadButton";

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
    softwareVersion: release?.tag_name || "0.1.0-alpha",
    datePublished: release?.published_at || new Date().toISOString(),
    author: {
      "@type": "Person",
      name: "Kp Adeyinka",
    },
    downloadUrl: release?.assets.find((a) => a.name.endsWith(".dmg"))
      ?.browser_download_url,
    screenshot: "https://audexis.app/screenshot.png",
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">
            Audexis
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl">
            A powerful and intuitive audio metadata editor for macOS. Edit ID3
            tags, album art, and more with ease.
          </p>

          <div className="mt-8">
            <DownloadButton release={release} />
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-3xl">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary/10 p-3">
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
              <h3 className="font-semibold text-foreground">Batch Editing</h3>
              <p className="text-sm text-muted-foreground">
                Edit multiple files at once
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary/10 p-3">
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
              <h3 className="font-semibold text-foreground">Album Art</h3>
              <p className="text-sm text-muted-foreground">
                Add and edit cover images
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary/10 p-3">
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
              <h3 className="font-semibold text-foreground">Fast & Native</h3>
              <p className="text-sm text-muted-foreground">
                Built with Tauri for speed
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-sm text-muted-foreground">
          <a
            href="https://github.com/kp-fyn/audexis"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            View on GitHub
          </a>
        </footer>
      </div>
    </>
  );
}
