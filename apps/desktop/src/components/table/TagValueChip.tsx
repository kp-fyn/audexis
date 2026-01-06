export default function TagValueChip({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="inline-flex max-w-full  items-center rounded-sm bg-primary/10 px-2 py-0.5 text-[11px] leading-tight font-medium text-foreground/80 border border-border/60 shadow-sm hover:bg-primary/15 transition-colors truncate"
    >
      {text}
    </span>
  );
}
