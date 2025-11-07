"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DocsGroup } from "@/app/docs/registry";

interface SearchProps {
  groups: DocsGroup[];
}

interface SearchResult {
  title: string;
  href: string;
  group: string;
}

export default function SearchBar({ groups }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchableItems: SearchResult[] = groups.flatMap((group) =>
      group.items.map((item) => ({
        title: item.title || "",
        href: item.href || "",
        group: group.label || "",
      }))
    );

    const searchQuery = query.toLowerCase();
    const filtered = searchableItems.filter((item) => {
      const titleMatch =
        item.title?.toLowerCase().includes(searchQuery) || false;
      const groupMatch =
        item.group?.toLowerCase().includes(searchQuery) || false;
      return titleMatch || groupMatch;
    });

    setResults(filtered);
    setSelectedIndex(0);
  }, [query, groups]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      router.push(result.href);
      setIsOpen(false);
      setQuery("");
    },
    [router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }

      if (isOpen && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + results.length) % results.length
          );
        }
        if (e.key === "Enter" && results[selectedIndex]) {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect]);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="group flex items-center gap-3 px-4 py-1.5 bg-muted/50 hover:bg-muted/80 border border-border rounded-lg transition-all duration-150 text-left sm:w-full w-auto"
      >
        <svg
          className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline text-sm text-muted-foreground group-hover:text-foreground flex-1">
          Search documentation...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-muted-foreground bg-background border border-border rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {query && results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </div>
              )}

              {results.length > 0 && (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.href}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`
                        w-full px-4 py-3 text-left transition-colors duration-100
                        ${
                          index === selectedIndex
                            ? "bg-primary/10 border-l-2 border-primary"
                            : "border-l-2 border-transparent hover:bg-muted/50"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-4 h-4 text-muted-foreground flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {result.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {result.group}
                          </div>
                        </div>
                        {index === selectedIndex && (
                          <svg
                            className="w-4 h-4 text-primary flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!query && (
                <div className="px-4 py-8 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Start typing to search documentation...
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">
                        ↑
                      </kbd>
                      <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">
                        ↓
                      </kbd>
                      to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">
                        ↵
                      </kbd>
                      to select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">
                        esc
                      </kbd>
                      to close
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
