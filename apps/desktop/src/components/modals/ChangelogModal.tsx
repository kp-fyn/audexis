import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getVersion } from "@tauri-apps/api/app";
import { Modal, useAnimatedModalClose } from "./Modal";
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
  const [version, setVersion] = useState<string>("");
  const [content, setContent] = useState<string>("");

  const { closing, requestClose } = useAnimatedModalClose(onClose, 160);
  useEffect(() => {
    getVersion().then((ver) => setVersion(ver));
  }, []);
  useEffect(() => {
    if (!open) return;
    fetch(
      `https://raw.githubusercontent.com/kp-fyn/audexis/refs/heads/main/apps/www/src/pages/v${version}.md`,
    )
      .then((res) => res.text())
      .then((text) => {
        const { body } = getBody(text);

        setContent(body);
      })
      .catch(() => setContent("No changelog available."));
  }, [version, open]);

  return (
    <Modal
      open={open}
      onClose={requestClose}
      closing={closing}
      title={`Release notes • v${version}`}
      description="What's new in this version"
      bodyClassName="p-0"
    >
      <div className="px-8 md:px-20 py-8 prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    </Modal>
  );
}

function getBody(source: string): {
  body: string;
} {
  const body = source.replace(/^---\n[\s\S]+?\n---/, "").trim();

  return { body };
}
