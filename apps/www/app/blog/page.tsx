"use server";

import Link from "next/link";
import { getBlogItems } from "./registry";

export default async function BlogHome() {
  const blogPages = await getBlogItems();

  return (
    <div className="min-h-screen w-full flex flex-col gap-y-5">
      <section className="relative mx-auto w-full max-w-6xl px-6 sm:px-8 md:px-10">
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-accent/40 via-accent/20 to-background">
          <div className="px-6 sm:px-10 py-12 sm:py-16">
            <h1 className="text-foreground text-4xl sm:text-5xl font-bold tracking-tight">
              Blog
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Insights, updates, and deep dives from the Audexis team.
            </p>
            <div className="mt-6 flex gap-3">
              <a className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition">
                Latest posts
              </a>
              <a className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/30 transition">
                Categories
              </a>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/30 blur-2xl"></div>
            <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-secondary/30 blur-2xl"></div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 sm:px-8 md:px-10 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {blogPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group"
              aria-label={page.title}
            >
              <article
                className="
                  rounded-lg border border-border
                  hover:bg-accent/30
                  transition-colors
                  shadow-sm hover:shadow-md
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  p-4 sm:p-5 flex flex-col gap-3 h-full
                "
              >
                <h2
                  className="
                    text-foreground text-xl sm:text-2xl font-semibold leading-tight
                    group-hover:text-primary
                  "
                >
                  {page.title}
                </h2>

                <div className="text-muted-foreground text-sm flex items-center gap-2">
                  <span>
                    {new Date(page.date).toLocaleDateString(undefined, {
                      year: "numeric",

                      month: "long",
                      day: "numeric",
                    })}
                  </span>

                  {page.date && page.readingTime ? <span>•</span> : null}

                  <span>{page.readingTime} min read</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {page.description}
                </p>

                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-primary font-medium">Read more</span>
                  <svg
                    className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M13 5l7 7-7 7M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
