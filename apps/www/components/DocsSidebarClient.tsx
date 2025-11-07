"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type DocsNavItem = { href: string; title: string };
export type DocsGroup = { label: string; items: DocsNavItem[] };

export default function DocsSidebarClient({ groups }: { groups: DocsGroup[] }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6 overflow-y-scroll">
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
