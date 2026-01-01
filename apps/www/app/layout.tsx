import "../styles/globals.css";
import Link from "next/link";

import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.audexis.app"),
  title: {
    default: "Audexis - Audio Metadata Editor for macOS",
    template: "%s | Audexis",
  },

  description:
    "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, manage album art, batch rename files, and organize your music library with ease.",
  keywords: [
    "audio metadata editor",
    "ID3 tag editor",
    "MP3 tag editor",
    "M4A editor",
    "music library organizer",
    "album art editor",
    "batch tag editor",
    "macOS music tool",
    "audio file renamer",
    "music metadata",
  ],
  authors: [{ name: "Kp" }],
  creator: "Kp",
  publisher: "Audexis",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.audexis.app",
    title: "Audexis - Audio Metadata Editor for macOS",
    description:
      "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, manage album art, and organize your music library.",
    siteName: "Audexis",
    images: [
      {
        url: "/api/og?type=landing",
        width: 1200,
        height: 630,
        alt: "Audexis - Audio Metadata Simplified",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Audexis - Audio Metadata Editor for macOS",
    description:
      "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, manage album art, and organize your music library.",
    images: ["/api/og?type=landing"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let theme = (await cookies()).get("theme")?.value || "light";

  if (theme !== "light" && theme !== "dark") {
    theme = "light";
  }

  return (
    <html lang="en" dir="ltr" data-theme={theme} suppressHydrationWarning>
      <head></head>

      <body>
        <ThemeProvider>
          <Navbar />
          <main className="mt-14">{children}</main>
          <footer className=" px-4 py-8 text-sm opacity-70 border-t border-border">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <div>MIT {new Date().getFullYear()} © Audexis</div>
              <div className="flex items-center gap-6">
                <Link
                  href="/docs"
                  className="hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>{" "}
                <Link
                  href="/blog"
                  className="hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
                <a
                  href="https://github.com/kp-fyn/audexis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
