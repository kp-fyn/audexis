import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: {
    default: "Audexis - Audio Metadata Editor for macOS",
    template: "%s | Audexis",
  },
  description:
    "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, album art, track information, and more with ease. Built with Tauri for native performance and speed.",
  keywords: [
    "audio metadata editor",
    "ID3 tag editor",
    "music tag editor",
    "album art editor",
    "macOS audio editor",
    "mp3 tag editor",
    "music metadata",
    "audio file tagger",
    "ID3v2 editor",
    "batch audio editor",
    "music library organizer",
    "tauri app",
    "native macOS app",
    "audio tagging software",
    "music file editor",
  ],
  authors: [{ name: "Kp Adeyinka" }],
  creator: "Kp Adeyinka",
  publisher: "Audexis",
  applicationName: "Audexis",
  category: "Multimedia",
  classification: "Audio Editor",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://audexis.app",
    siteName: "Audexis",
    title: "Audexis - Audio Metadata Editor for macOS",
    description:
      "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, album art, track information, and more with ease.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Audexis Audio Metadata Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Audexis - Audio Metadata Editor for macOS",
    description:
      "A powerful and intuitive audio metadata editor for macOS. Edit ID3 tags, album art, and more with ease.",
    images: ["/og-image.png"],
    creator: "@audexis",
  },
  alternates: {
    canonical: "https://audexis.app",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Audexis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'system';
                let resolved = theme;
                if (theme === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', resolved);
              })();
            `,
          }}
        />
      </head>
      <body className={`antialiased`}>
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
