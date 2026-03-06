import {
  Children,
  isValidElement,
  cloneElement,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  CheckMenuItem,
  CheckMenuItemOptions,
  IconMenuItem,
  IconMenuItemOptions,
  Menu,
  MenuItem,
  MenuItemOptions,
  PredefinedMenuItem,
  PredefinedMenuItemOptions,
  Submenu,
  SubmenuOptions,
} from "@tauri-apps/api/menu";

export type MenuOptions = Array<
  | Submenu
  | MenuItem
  | PredefinedMenuItem
  | CheckMenuItem
  | IconMenuItem
  | MenuItemOptions
  | SubmenuOptions
  | IconMenuItemOptions
  | PredefinedMenuItemOptions
  | CheckMenuItemOptions
>;

export function ContextMenuArea({
  items,
  children,
}: {
  items: () => MenuOptions;

  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  const menuRef = useRef<Menu | null>(null);
  const openingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const built = await Menu.new({ items: itemsRef.current() });
      if (cancelled) return;
      if (menuRef.current) {
        await menuRef.current.close();
      }
      menuRef.current = built;
    })();

    return () => {
      cancelled = true;
      menuRef.current?.close();
      menuRef.current = null;
      openingRef.current = false;
    };
  }, []);

  const clickHandler = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (openingRef.current === true) return;
    openingRef.current = true;

    try {
      const menu = menuRef.current;
      if (!menu) return;
      await menu.popup();
    } finally {
      setTimeout(() => {
        openingRef.current = false;
      }, 75);
    }
  }, []);

  if (!isValidElement(children) || Children.count(children) !== 1) {
    return <>needs to be 1 child twan</>;
  }

  return cloneElement(children as React.ReactElement<any>, {
    ...children.props,
    onContextMenu: (e: React.MouseEvent) => clickHandler(e),
    className: `${children.props.className ?? ""} w-full`,
  });
}
