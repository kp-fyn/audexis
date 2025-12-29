import { getLatestRelease } from "@/lib/github";
import { DownloadButton } from "@/components/DownloadButton";
import Link from "next/link";

import Screenshot from "@/components/Screenshot";
import Script from "next/script";
import { Button } from "@/components/Button";
import Image from "next/image";
import Features from "./Features";

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
    screenshot: "https://www.audexis.app/screenshot-dark.png",
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
      <div className="flex min-h-screen flex-col  bg-background">
        <section className="flex flex-col px-8 lg:px-16  items-center justify-center  ">
          <div className="flex flex-col mt-18 space-y-4 w-full">
            <h1 className=" text-4xl sm:text-6xl md:text-8xl text-center   font-bold tracking-tight text-foreground">
              Audio Metadata
              <br />
              <span className="text-primary">Simplified</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-4xl text-center mx-auto">
              A powerful and intuitive audio metadata editor for macOS and
              Windows. Edit ID3 tags, manage album art, batch rename files, and
              organize your music library with ease.
            </p>

            <div className="flex justify-center flex-col-reverse lg:flex-row item-center gap-4 ">
              <DownloadButton metadata release={release} />
              <div className="w-full lg:w-auto">
                <Button
                  variant={"outline"}
                  className="w-full"
                  size={"lg"}
                  asChild
                >
                  <Link href="/docs">View Documentation</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1  flex">
            <div className="lg:ml-auto items-center lg:pl-12">
              <div>
                <Screenshot
                  fetchPriority="high"
                  src={`/screenshot`}
                  alt="Audexis Screenshot"
                  width={1200}
                  height={300}
                  className="max-w-full rounded drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        <Features />
        <section className=" py-12 mt-24 px-4 lg:px-32 rounded-lg">
          <h2 className="text-4xl md:text-4xl font-semibold text-foreground mb-4">
            Customize to your Liking
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Tailor Audexis to fit your workflow and aesthetic preferences with a
            variety of customization options.
          </p>
          <div className="flex flex-col lg:flex-row mt-6 gap-x-24 gap-y-12">
            <div className="flex mt-6 flex-col gap-8">
              {MiniCustomizationFeatures.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`space-y-2 ${
                    i + 1 !== MiniCustomizationFeatures.length
                      ? "border-b border-border pb-4"
                      : ""
                  }`}
                >
                  <h3 className="text-2xl  text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
            <div className=" flex a justify-center w-full  mb-8 md:mb-0">
              <Screenshot
                width={1200}
                height={100}
                src={`/settings`}
                alt="Multi Image aspect-video Editing Support in Audexis"
                className="rounded-lg border border-border shadow-xl "
              />
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
        <section className="py-12 bg-muted/70 flex flex-col lg:flex-row mt-24 px-4 lg:px-32 gap-6 rounded-lg ">
          <div className="flex flex-col">
            <h3 className="text-4xl font-semibold text-foreground mb-2">
              Take Control of Your Audio Library
            </h3>
            <p className="text-muted-foreground max-w-xl">
              Audexis empowers you to effortlessly manage and edit your audio
              metadata, ensuring your music collection is always organized and
              up-to-date.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:ml-auto items-center justify-center gap-4 mt-8">
            <DownloadButton release={release} />
            <Button variant={"outline"} asChild size={"lg"}>
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
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

const MiniCustomizationFeatures = [
  {
    title: "Theme Options",
    description:
      "Choose between light, dark, or system themes to match your macOS appearance settings.",
  },
  {
    title: "Column Customization",
    description: "Drag and drop columns to customize your workspace.",
  },
  {
    title: "Flexible Layouts",
    description:
      "Adjust the layout to suit your workflow, whether you prefer a compact view or detailed information.",
  },
];
