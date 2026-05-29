import { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

export type MenuOptions = Array<MenuItem | OtherItem>;
type MenuItem = {
  text: string;
  action?: () => void | Promise<void>;
  disabled?: boolean;
};
type OtherItem = {
  item: string;
};
type MenuRef = {
  x: number;
  y: number;
};
export function ContextMenuArea({
  items,
  children,
  ...props
}: {
  items: () => MenuOptions;

  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, []);

  const [menuState, setMenuState] = useState<MenuRef | null>(null);
  const openingRef = useRef(false);

  const clickHandler = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (openingRef.current) return;
    openingRef.current = true;
    setMenuState({
      x: event.clientX,
      y: event.clientY,
    });
    openingRef.current = false;
  }, []);

  return (
    <div {...props} onContextMenu={clickHandler}>
      {children}
      <PortalContextMenu
        menuState={menuState}
        items={itemsRef.current}
        setMenuState={setMenuState}
      />
    </div>
  );
}
function PortalContextMenu({
  menuState,
  items,
  setMenuState,
}: {
  menuState: MenuRef | null;
  items: () => MenuOptions;
  setMenuState: (menuState: MenuRef | null) => void;
}) {
  return createPortal(
    menuState ? (
      <Menu rr={menuState} items={items} setMenuState={setMenuState} />
    ) : null,
    document.body,
  );
}
function Menu({
  rr,
  items,
  setMenuState,
}: {
  rr: MenuRef;
  setMenuState: (menuState: MenuRef | null) => void;
  items: () => MenuOptions;
}) {
  const [position, setPosition] = useState<MenuRef>(rr);
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setPosition(rr);
  }, [rr]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (divRef.current && !divRef.current.contains(event.target as Node)) {
        setMenuState(null);
      }
    }

    const el = divRef.current;

    if (!el) return;
    const rect = el.getBoundingClientRect();
    const overflowX = rect.right - window.innerWidth;
    const overflowY = rect.bottom - window.innerHeight;
    if (overflowX > 0) {
      setPosition({ ...position, x: Math.max(0, rr.x - overflowX) });
    }
    if (overflowY > 0) {
      setPosition({ ...position, y: Math.max(0, rr.y - overflowY) });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setMenuState, divRef, rr, position]);

  return (
    <div
      ref={divRef}
      className="fixed w-48  text-xs z-[9999999999999999999999999999999999999999999999999] bg-background border border-border rounded shadow-lg"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      {items().map((item, index) => {
        if ("text" in item) {
          return (
            <div
              className="hover:bg-hover"
              key={index}
              style={{
                padding: "4px 8px",
                cursor: item.disabled === true ? "not-allowed" : "default",
                color: item.disabled
                  ? "text-muted-foreground"
                  : "text-foreground",
              }}
              onClick={() => {
                if (item.disabled) return;
                item.action?.();
                setMenuState(null);
              }}
            >
              {item.text}
            </div>
          );
        } else if ("item" in item) {
          if (item.item === "separator") {
            return <hr key={index} className="border-t border-border my-1" />;
          } else {
            return <hr key={index} className="border-t border-border my-1" />;
          }
        }
      })}
    </div>
  );
}
