import { useEffect, useRef } from "react";

export interface ShortcutSpec {
  combo: string;
  handler: () => void;
}

function parseCombo(combo: string) {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const meta = parts.includes("mod");
  const alt = parts.includes("alt");
  const shift = parts.includes("shift");
  const ctrl = parts.includes("ctrl");
  const key = parts.find((k) => !["mod", "alt", "shift", "ctrl"].includes(k));
  return { meta, alt, shift, ctrl, key };
}

export default function useShortcuts() {
  const specsRef = useRef<ShortcutSpec[]>([]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const keyLower = e.key.toLowerCase();
      for (const spec of specsRef.current) {
        const { meta, alt, shift, ctrl, key } = parseCombo(spec.combo);
        if (meta && !(e.metaKey || e.ctrlKey)) continue;
        if (ctrl && !e.ctrlKey) continue;
        if (alt && !e.altKey) continue;
        if (shift && !e.shiftKey) continue;
        if (key && key !== keyLower) continue;
        e.preventDefault();
        spec.handler();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  function register(specs: ShortcutSpec[]) {
    specsRef.current = [...specsRef.current, ...specs];
    return () => {
      specsRef.current = specsRef.current.filter((s) => !specs.includes(s));
    };
  }

  return { register };
}
