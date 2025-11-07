import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 mt-2 pb-4 border-b border-border/50"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border/30 scroll-mt-20"
        id={props.children?.toString().toLowerCase().replace(/\s+/g, "-")}
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="text-xl md:text-2xl font-semibold text-foreground mt-8 mb-3 scroll-mt-20"
        id={props.children?.toString().toLowerCase().replace(/\s+/g, "-")}
        {...props}
      />
    ),
    h4: (props) => (
      <h4
        className="text-lg md:text-xl font-semibold text-foreground mt-6 mb-2"
        {...props}
      />
    ),
    p: (props) => (
      <p
        className="leading-7 text-muted-foreground my-4 text-[15px]"
        {...props}
      />
    ),
    a: (props) => (
      <a
        className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 underline-offset-2 transition-colors font-medium"
        {...props}
      />
    ),
    ul: (props) => <ul className="list-none space-y-2 my-6 ms-0" {...props} />,
    ol: (props) => (
      <ol className="list-decimal ms-6 my-6 space-y-2" {...props} />
    ),
    li: (props) => {
      return (
        <li
          className="flex gap-3 text-muted-foreground text-[15px] leading-7 items-start"
          {...props}
        >
          <span className="text-primary  flex-shrink-0">●</span>
          <span className="">{props.children}</span>
        </li>
      );
    },
    code: (props) => {
      // add highlighting later
      const isInline = !props.className?.includes("language-");
      console.log(props);
      return isInline ? (
        <code
          className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[14px] font-mono text-foreground border border-border/50"
          {...props}
        />
      ) : (
        <code {...props} />
      );
    },
    pre: (props) => (
      <pre
        className="rounded-lg text-foreground bg-muted/40 border border-border/50 p-4 overflow-x-auto my-6 shadow-sm"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="border-l-4 border-primary/30 bg-muted/30 rounded-r-lg pl-4 pr-4 py-3 my-6 text-muted-foreground italic"
        {...props}
      />
    ),
    table: (props) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-border/50 shadow-sm">
        <table className="min-w-full text-sm" {...props} />
      </div>
    ),
    thead: (props) => (
      <thead className="bg-muted/50 border-b border-border" {...props} />
    ),
    th: (props) => (
      <th
        className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 last:border-r-0"
        {...props}
      />
    ),
    td: (props) => (
      <td
        className="px-4 py-3 align-top text-muted-foreground border-r border-border/20 last:border-r-0"
        style={{ borderTop: "1px solid rgb(var(--border) / 0.2)" }}
        {...props}
      />
    ),
    hr: (props) => <hr className="my-8 border-border/50" {...props} />,
    strong: (props) => (
      <strong className="font-semibold text-foreground" {...props} />
    ),
    em: (props) => <em className="italic text-foreground/90" {...props} />,
    ...components,
  };
}
