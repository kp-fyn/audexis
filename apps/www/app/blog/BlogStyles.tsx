"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import TableOfContents from "../../components/TableOfContents";
export default function BlogStyles({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  let pathname = usePathname();
  if (pathname === "/blog" || pathname === "/blog/")
    return <div className="mt-24">{children}</div>;

  const handleBack = () => {
    router.push("/blog");
  };
  return (
    <div className="min-h-screen bg-background mx-auto max-w-7xl">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <aside className="lg:col-span-3 xl:col-span-3 hidden lg:block">
            <div className="sticky top-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="
                      inline-flex items-center gap-2 rounded-md
                      border border-border bg-card text-foreground
                      px-3 py-2 text-sm font-medium
                      hover:bg-accent/30 hover:text-foreground
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      transition-colors
                    "
                aria-label="Go back to blog"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to Blog
              </button>
            </div>
          </aside>

          <main className="blog lg:col-span-9 xl:col-span-7 min-w-0">
            <div className="mb-6 lg:hidden">
              <button
                type="button"
                onClick={handleBack}
                className="
                      inline-flex items-center gap-2 rounded-md
                      border border-border bg-card text-foreground
                      px-3 py-2 text-sm font-medium
                      hover:bg-accent/30 hover:text-foreground
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      transition-colors
                    "
                aria-label="Go back to blog"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M15 19l-7-7 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to Blog
              </button>
            </div>
            <div className="prose prose-slate dark:prose-invert ">
              {children}
            </div>
          </main>

          <div className="hidden xl:block xl:col-span-2">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pb-8">
              <TableOfContents />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
