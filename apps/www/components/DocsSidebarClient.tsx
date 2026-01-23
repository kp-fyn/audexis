"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { createPortal } from "react-dom";

export type DocsNavItem = { href: string; title: string };
export type DocsGroup = { label: string; items: DocsNavItem[] };

export default function DocsSidebarClient({
  groups,
  mode,
}: {
  groups: DocsGroup[];
  mode?: "mobile-toggle";
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (open) setVisible(true);
  }, [open]);
  const closeWithAnimation = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 180);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWithAnimation();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (mode === "mobile-toggle") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="
            inline-flex items-center gap-2 rounded-md
            border border-border bg-background text-foreground
            px-3 py-2 text-sm font-medium
            hover:bg-accent/30 transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
          "
          aria-label="Open documentation navigation"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Browse docs
        </button>

        {mounted &&
          open &&
          createPortal(
            <div
              className="fixed inset-0 z-1000"
              role="dialog"
              aria-modal="true"
            >
              <button
                className={
                  "absolute inset-0 bg-background/70 backdrop-blur-sm " +
                  (visible
                    ? "animate-[backdropFadeIn_180ms_ease-out]"
                    : "animate-[backdropFadeOut_180ms_ease-in]")
                }
                onClick={closeWithAnimation}
                aria-label="Close navigation"
              />

              <div
                className={
                  "absolute inset-y-0 left-0 w-full sm:max-w-sm bg-background border-r border-border shadow-2xl flex flex-col " +
                  (visible
                    ? "animate-[drawerSlideIn_180ms_ease-out]"
                    : "animate-[drawerSlideOut_180ms_ease-in]")
                }
              >
                <div className="flex items-center justify-between px-3 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-primary rounded-full" />
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        Documentation
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Audexis
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeWithAnimation}
                    className="
                      inline-flex items-center gap-2 rounded-md
                      border border-border bg-muted/40 text-foreground
                      px-2 py-1.5 text-xs font-medium
                      hover:bg-accent/30 transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    "
                    aria-label="Close navigation"
                  >
                    Close
                  </button>
                </div>

                <div className="p-3 overflow-y-auto">
                  {groups.map((group) => (
                    <div key={group.label} className="space-y-3 mb-4">
                      {group.label !== "General" && (
                        <div className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {group.label}
                        </div>
                      )}
                      <ul className="space-y-1">
                        {group.items.map((item) => {
                          const active = pathname === item.href;
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={closeWithAnimation}
                                className={
                                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 " +
                                  (active
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent")
                                }
                                aria-current={active ? "page" : undefined}
                              >
                                <span
                                  className={
                                    active
                                      ? ""
                                      : "group-hover:translate-x-0.5 transition-transform"
                                  }
                                >
                                  {item.title}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )}
      </>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
      {groups.map((group) => (
        <div key={group.label} className="space-y-3">
          {group.label !== "General" && (
            <div className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </div>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 " +
                      (active
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent")
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={
                        active
                          ? ""
                          : "group-hover:translate-x-0.5 transition-transform"
                      }
                    >
                      {item.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
