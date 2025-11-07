import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="relative">
          <h1 className="text-[180px] md:text-[240px] font-bold leading-none text-primary/10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="h-12 w-1 bg-primary rounded-full" />
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  Page Not Found
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium transition-all duration-150 hover:bg-primary/90 hover:shadow-lg hover:scale-105"
            >
              <svg
                className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Home
            </Link>

            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg font-medium transition-all duration-150 hover:bg-muted/80 border border-border"
            >
              View Documentation
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/docs/getting-started"
              className="text-sm text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors"
            >
              Getting Started
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link
              href="/docs/guides/editing-tags"
              className="text-sm text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors"
            >
              Editing Tags
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link
              href="/docs/reference/keyboard-shortcuts"
              className="text-sm text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors"
            >
              Keyboard Shortcuts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
