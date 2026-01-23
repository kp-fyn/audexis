import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/ui/lib/utils";
import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";

export type CMItem =
  | {
      type: "item";
      id?: string;
      label: string;
      shortcut?: string;
      icon?: React.ReactNode;
      disabled?: boolean;
      danger?: boolean;
      onSelect?: () => void;
    }
  | { type: "separator"; id?: string }
  | { type: "label"; id?: string; label: string }
  | { type: "submenu"; id?: string; label: string; items: CMItem[] };

export type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  items: CMItem[];
  target: HTMLElement | null;
};

type Ctx = {
  openAt: (
    x: number,
    y: number,
    items: CMItem[],
    target: HTMLElement | null,
  ) => void;
  close: () => void;
};

const Context = createContext<Ctx | null>(null);

export function ContextMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    items: [],
    target: null,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const openAt = useCallback(
    (x: number, y: number, items: CMItem[], target: HTMLElement | null) => {
      setState({ open: true, x, y, items, target });
    },
    [],
  );

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick, {
        capture: true,
      } as any);
    };
  }, [state.open, close]);

  const value = useMemo(() => ({ openAt, close }), [openAt, close]);

  return (
    <Context.Provider value={value}>
      {children}
      {state.open &&
        createPortal(
          <MenuOverlay
            ref={containerRef}
            x={state.x}
            y={state.y}
            state={state}
            setState={setState}
            items={state.items}
            onClose={close}
          />,
          document.body,
        )}
    </Context.Provider>
  );
}

export function useContextMenu() {
  const ctx = useContext(Context);
  if (!ctx)
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  return ctx;
}

export function ContextMenuArea({
  items,
  children,
  className,
  asChild,
}: {
  items: CMItem[] | ((e: React.MouseEvent) => CMItem[]);
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { openAt } = useContextMenu();
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const list = typeof items === "function" ? items(e) : items;
      openAt(e.clientX, e.clientY, list, e.target as HTMLElement | null);
    },
    [items, openAt],
  );
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    const childOnContextMenu = child.props?.onContextMenu as
      | ((e: React.MouseEvent) => void)
      | undefined;
    const merged = (e: React.MouseEvent) => {
      onContextMenu(e);
      childOnContextMenu?.(e);
    };
    return React.cloneElement(child, {
      onContextMenu: merged,
      className: cn(child.props.className, className),
    });
  }
  return (
    <div onContextMenu={onContextMenu} className={className}>
      {children}
    </div>
  );
}

const MenuOverlay = React.forwardRef<
  HTMLDivElement,
  {
    x: number;
    y: number;
    items: CMItem[];
    onClose: () => void;
    state: ContextMenuState;
    setState: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  }
>(({ x, y, items, setState, state }, ref) => {
  const [pos, setPos] = useState({ left: x, top: y });
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [openSub, setOpenSub] = useState<{
    index: number;
    pos: { left: number; top: number };
  } | null>(null);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(x, vw - rect.width - 8);
    const top = Math.min(y, vh - rect.height - 8);
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [x, y]);
  function isEditableElement(el: Element | null): el is HTMLElement {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      el.getAttribute("contenteditable") === "true"
    );
  }

  function copyFromTarget(target: HTMLElement | null): string | null {
    if (!target) return null;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;
      if (end > start) return target.value.substring(start, end);
    }
    const sel = window.getSelection();
    const str = sel?.toString();
    return str && str.length > 0 ? str : null;
  }

  const defaultItems: CMItem[] = [
    {
      label: "Copy",
      shortcut: "⌘C",
      type: "item",
      disabled: !copyFromTarget(state.target),
      onSelect: () => {
        const textToCopy = copyFromTarget(state.target);
        if (textToCopy) writeText(textToCopy);
        setState((s) => ({ ...s, open: false }));
      },
    },
    {
      label: "Paste",
      shortcut: "mod+V",
      type: "item",
      disabled: !isEditableElement(state.target),
      onSelect: () => {
        const target = state.target;
        readText().then((text) => {
          if (!text) return;
          if (!target) return;
          if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement
          ) {
            target.focus();
            const start = target.selectionStart ?? target.value.length;
            const end = target.selectionEnd ?? target.value.length;
            if (typeof target.setRangeText === "function") {
              target.setRangeText(text, start, end, "end");
            } else {
              const value = target.value;
              target.value = value.slice(0, start) + text + value.slice(end);
            }
            target.dispatchEvent(
              new InputEvent("input", {
                bubbles: true,
                cancelable: true,
                inputType: "insertFromPaste",
                data: text,
              }),
            );
          } else if (isEditableElement(target)) {
            (target as HTMLElement).focus();
            document.execCommand("insertText", false, text);
          }
          setState((s) => ({ ...s, open: false }));
        });
      },
    },
    { type: "separator" },
  ];
  const newItems = [...defaultItems, ...items];
  return (
    <div className="fixed inset-0 z-[9999999999999999999999999]" aria-hidden>
      <div
        ref={(node) => {
          if (typeof ref === "function") ref(node as HTMLDivElement);
          else if (ref)
            (ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
          measureRef.current = node;
        }}
        style={{ left: pos.left, top: pos.top, position: "fixed" }}
        className={cn(
          "bg-background text-popover-foreground z-1000 min-w-48 max-w-72 rounded-md border border-border p-1 shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-96 overflow-auto",
        )}
      >
        {newItems.map((it, idx) => {
          if (it.type === "separator") {
            return (
              <div
                key={it.id ?? `sep-${idx}`}
                className="bg-border -mx-1 my-1 h-px"
              />
            );
          }
          if (it.type === "label") {
            return (
              <div
                key={it.id ?? `label-${idx}`}
                className="px-2 py-1.5 text-[11px] font-medium text-foreground/70"
              >
                {it.label}
              </div>
            );
          }
          if (it.type === "submenu") {
            return (
              <div
                key={it.id ?? `submenu-${idx}`}
                className={cn(
                  "relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-hidden select-none",
                  "hover:bg-muted/70",
                )}
                onMouseEnter={(e) => {
                  const rect = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  const left = Math.min(rect.right + 6, window.innerWidth - 8);
                  const top = Math.min(rect.top, window.innerHeight - 8);
                  setOpenSub({ index: idx, pos: { left, top } });
                }}
                onMouseLeave={() =>
                  setOpenSub((o) => (o && o.index === idx ? null : o))
                }
              >
                <span className="truncate">{it.label}</span>
                <span className="ml-auto text-muted-foreground">›</span>
                {openSub && openSub.index === idx ? (
                  <div
                    className="fixed z-1001 min-w-40 max-w-[20rem] rounded-md border border-border p-1 shadow-md bg-background max-h-96 overflow-auto"
                    style={{ left: openSub.pos.left, top: openSub.pos.top }}
                    onMouseEnter={() =>
                      setOpenSub({ index: idx, pos: openSub.pos })
                    }
                    onMouseLeave={() => setOpenSub(null)}
                  >
                    {it.items.map((sub, sIdx) => {
                      if (sub.type === "separator") {
                        return (
                          <div
                            key={sub.id ?? `sub-sep-${sIdx}`}
                            className="bg-border -mx-1 my-1 h-px"
                          />
                        );
                      }
                      if (sub.type === "label") {
                        return (
                          <div
                            key={sub.id ?? `sub-label-${sIdx}`}
                            className="px-2 py-1.5 text-[11px] font-medium text-foreground/70"
                          >
                            {sub.label}
                          </div>
                        );
                      }
                      if (sub.type === "submenu") {
                        return null;
                      }
                      const onClick = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (sub.disabled) return;
                        sub.onSelect?.();
                        setState((s) => ({ ...s, open: false }));
                      };
                      return (
                        <button
                          key={sub.id ?? `sub-item-${sIdx}`}
                          className={cn(
                            "relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-hidden select-none",
                            "hover:bg-muted/70",
                            (sub as any).danger
                              ? "text-destructive hover:bg-destructive/10"
                              : "",
                            (sub as any).disabled
                              ? "opacity-50 pointer-events-none"
                              : "",
                          )}
                          onClick={onClick}
                        >
                          {sub.icon ? (
                            <span className="shrink-0">{sub.icon}</span>
                          ) : null}
                          <span className="truncate">{sub.label}</span>
                          {sub.shortcut ? (
                            <span className="ml-auto text-xs text-muted-foreground tracking-widest">
                              {parseShortcut(sub.shortcut)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }
          const onClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (it.disabled) return;
            it.onSelect?.();
            setState((s) => ({ ...s, open: false }));
          };
          return (
            <button
              key={it.id ?? `item-${idx}`}
              className={cn(
                "relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-hidden select-none",
                "hover:bg-hover",
                it.danger ? "text-destructive hover:bg-destructive/10" : "",
                it.disabled ? "opacity-50 pointer-events-none" : "",
              )}
              onClick={onClick}
            >
              {it.icon ? <span className="shrink-0">{it.icon}</span> : null}
              <span className="truncate">{it.label}</span>
              {it.shortcut ? (
                <span className="ml-auto text-xs text-muted-foreground tracking-widest">
                  {parseShortcut(it.shortcut)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
});
MenuOverlay.displayName = "MenuOverlay";
function parseShortcut(shortcut: string) {
  shortcut = shortcut.replace(
    "mod",
    navigator.platform.includes("Mac") ? "⌘" : "Ctrl",
  );
  shortcut = shortcut.replace("cmd", "⌘");
  shortcut = shortcut.replace("ctrl", "Ctrl");
  shortcut = shortcut.replace("alt", "Alt");
  shortcut = shortcut.replace("shift", "Shift");
  return shortcut;
}
