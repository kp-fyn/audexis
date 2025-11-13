import "../styles/globals.css";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";
import { getDocsGroups } from "@/app/docs/registry";
import type { Metadata } from "next";
import Script from "next/script";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Audexis - Audio Metadata Editor for macOS",
    description:
      "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, manage album art, and organize your music library.",
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
  const groups = await getDocsGroups();

  return (
    <>
      <html lang="en" dir="ltr" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              try {
                const theme = localStorage.getItem("theme");
                if (
                  theme === "dark" ||
                  (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
                ) {
                  document.documentElement.setAttribute("data-theme", "dark");
                } else {
                  document.documentElement.setAttribute("data-theme", "light");
                }
              } catch (e) {}
            `,
            }}
          />
        </head>
        <body className="">
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="system"
            enableSystem
          >
            <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md py-1">
              <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <Link href="/" className="font-semibold">
                    Audexis
                  </Link>
                  <nav className="hidden sm:flex items-center gap-4 text-sm">
                    <Link href="/docs">Docs</Link>
                    <a
                      href="https://github.com/kp-fyn/audexis"
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHub
                    </a>
                  </nav>
                </div>

                <div className="hidden sm:block flex-1 max-w-md mx-auto">
                  <SearchBar groups={groups} />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <div className="sm:hidden">
                    <SearchBar groups={groups} />
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className=" px-4 py-6">{children}</main>
            <footer className=" px-4 py-8 text-sm opacity-70 border-t border-border">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <div>MIT {new Date().getFullYear()} © Audexis</div>
                <div className="flex items-center gap-6">
                  <Link
                    href="/docs"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
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
    </>
  );
}
