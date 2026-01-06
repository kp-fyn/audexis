import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { getVersion } from "@tauri-apps/api/app";
const markdownComponents = {
  h1: (props: any) => (
    <h1
      className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 mt-2 pb-4 border-b border-border/50"
      {...props}
    />
  ),
  h2: (props: any) => (
    <h2
      className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border/30 scroll-mt-20"
      {...props}
    />
  ),
  h3: (props: any) => (
    <h3
      className="text-xl md:text-2xl font-semibold text-foreground mt-8 mb-3 scroll-mt-20"
      {...props}
    />
  ),
  h4: (props: any) => (
    <h4
      className="text-lg md:text-xl font-semibold text-foreground mt-6 mb-2"
      {...props}
    />
  ),
  p: (props: any) => (
    <p
      className="leading-7 text-muted-foreground my-2 text-[15px]"
      {...props}
    />
  ),
  a: (props: any) => (
    <a
      className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 underline-offset-2 transition-colors font-medium"
      {...props}
    />
  ),
  ul: (props: any) => (
    <ul className="list-none space-y-2 my-6 ms-0" {...props} />
  ),
  ol: (props: any) => (
    <ol className="list-decimal ms-6 my-6 space-y-2" {...props} />
  ),
  li: (props: any) => (
    <li
      className="marker:text-primary gap-3 list-disc text-muted-foreground text-[15px] leading-7 items-start"
      {...props}
    />
  ),
  code: (props: any) => {
    const isInline = !props.className?.includes("language-");
    return isInline ? (
      <code
        className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[14px] font-mono text-foreground border border-border/50"
        {...props}
      />
    ) : (
      <code {...props} />
    );
  },
  pre: (props: any) => (
    <pre
      className="rounded-lg text-foreground bg-muted/40 border border-border/50 p-4 overflow-x-auto my-6 shadow-sm"
      {...props}
    />
  ),
  blockquote: (props: any) => (
    <blockquote
      className="border-l-4 border-primary bg-muted/30 rounded-r-lg pl-4 pr-4 py-1 my-6 text-muted-foreground italic"
      {...props}
    />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-border/50 shadow-sm">
      <table className="min-w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: any) => (
    <thead className="bg-muted/50 border-b border-border" {...props} />
  ),
  th: (props: any) => (
    <th
      className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 last:border-r-0"
      {...props}
    />
  ),
  td: (props: any) => (
    <td
      className="px-4 py-3 align-top text-muted-foreground border-r border-border/20 last:border-r-0"
      style={{ borderTop: "1px solid rgb(var(--border) / 0.2)" }}
      {...props}
    />
  ),
  hr: (props: any) => <hr className="my-8 border-border/50" {...props} />,
  strong: (props: any) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: (props: any) => <em className="italic text-foreground/90" {...props} />,
};
interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangelogModal({ open, onClose }: OnboardingModalProps) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const [version, setVersion] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let root = document.getElementById("modal-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    setPortalNode(root);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    setTimeout(() => firstFocusableRef.current?.focus(), 30);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleClose = useCallback(() => {
    setTimeout(() => {
      onClose();
    }, 160);
  }, [onClose]);
  useEffect(() => {
    getVersion().then((ver) => setVersion(ver));
  }, []);
  useEffect(() => {
    if (!open) return;
    fetch(
      `https://raw.githubusercontent.com/kp-fyn/audexis/refs/heads/main/apps/www/app/blog/(blogPages)/releases/v${version}.mdx`
    )
      .then((res) => res.text())
      .then((text) => {
        const { body } = getBody(text);

        setContent(body);
      })
      .catch(() => setContent("No changelog available."));
  }, [version, open]);

  if (!open || !portalNode) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-1200 flex items-center justify-center p-4 md:p-8"
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm border-t border-border animate-in fade-in"
        onClick={handleClose}
      />
      <div
        className={` px-2 flex flex-col relative w-full max-w-5xl rounded-lg border border-border bg-linear-to-b from-background/95 to-background/40 shadow-xl ring-1 ring-border/50  animate-in duration-150 h-[80vh] max-h-[80vh] fade-in scale-in-90 overflow-scroll`}
      >
        <div className="ml-auto">
          <button
            ref={firstFocusableRef}
            onClick={handleClose}
            className="p-3 m-3 rounded-md hover:bg-accent/50 transition-colors outline-none"
            aria-label="Close changelog modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-foreground/70 hover:text-foreground transition-colors"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="px-32  prose prose-slate dark:prose-invert max-w-none mb-16">
          <h1>Release notes for v{version} 🎉</h1>

          <ReactMarkdown components={markdownComponents}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>,
    portalNode
  );
}

function getBody(source: string): {
  body: string;
} {
  const re = /export const metadata\s*=\s*({[\s\S]*?});?/;
  const match = source.match(re);

  if (!match) {
    return { body: source };
  }

  const body = source.replace(re, "").trimStart();

  return { body };
}
