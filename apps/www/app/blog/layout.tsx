import type { Metadata } from "next";
import BlogStyles from "./BlogStyles";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "/api/og?type=blog&title=Blog&subtitle=Insights%2C%20updates%2C%20from%20the%20Audexis%20team.",
        width: 1200,
        height: 630,
        alt: "Audexis Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "/api/og?type=blog&title=Blog&subtitle=Insights%2C%20updates%2C%20from%20the%20Audexis%20team.",
    ],
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlogStyles>{children}</BlogStyles>;
}
