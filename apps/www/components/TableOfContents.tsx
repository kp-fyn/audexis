"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const article = document.querySelector("main.docs");
      if (!article) return;

      const elements = article.querySelectorAll("h2, h3");
      const items: TocItem[] = Array.from(elements).map((element) => ({
        id: element.id,
        text: element.textContent || "",
        level: parseInt(element.tagName.charAt(1)),
      }));

      setHeadings(items);
      setActiveId("");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        {
          rootMargin: "-100px 0px -66%",
          threshold: 1.0,
        }
      );

      elements.forEach((element) => {
        observer.observe(element);
      });

      return () => {
        elements.forEach((element) => {
          observer.unobserve(element);
        });
      };
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  if (headings.length === 0) {
    return null;
  }

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-0.5 bg-primary rounded-full" />
        <h4 className="text-sm font-semibold text-foreground">On This Page</h4>
      </div>

      <nav className="space-y-2">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => scrollToHeading(heading.id)}
            className={`
              group block w-full text-left text-sm transition-all duration-150
              ${heading.level === 3 ? "pl-4" : ""}
              ${
                activeId === heading.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <span
              className={`
              block py-1.5 border-l-2 pl-3 transition-all duration-150
              ${
                activeId === heading.id
                  ? "border-primary"
                  : "border-transparent group-hover:border-border"
              }
            `}
            >
              {heading.text}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
