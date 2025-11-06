import { useEffect } from "react";
import isHotkey from "is-hotkey";

export type HotkeyBinding = {
  combo: string | string[];
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  allowInInputs?: boolean;
};

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof Element)) return false;
  const tag = t.tagName.toLowerCase();
  const editable =
    t.getAttribute("contenteditable") === "true" ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "select";
  return editable;
}

export function useHotkeys(
  bindings: HotkeyBinding[],
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const normalized = bindings.map((b) => ({
      ...b,
      combos: Array.isArray(b.combo) ? b.combo : [b.combo],
    }));

    function onKeyDown(e: KeyboardEvent) {
      for (const b of normalized) {
        if (!b.allowInInputs && isEditableTarget(e.target)) continue;
        const match = b.combos.some((c) => {
          return isHotkey(c, e);
        });
        if (match) {
          if (b.preventDefault !== false) e.preventDefault();
          if (b.stopPropagation) e.stopPropagation();
          b.handler(e);
          break;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, {
        capture: true,
      } as any);
  }, deps);
}

export default useHotkeys;
