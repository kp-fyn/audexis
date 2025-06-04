import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { cn } from "../lib/utils";

export default function DropdownMenu({ children, items, className }: Props): JSX.Element {
  return (
    <Menu>
      <MenuButton
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full hover:bg-hover",
          className
        )}
      >
        {children}
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className="w-52 origin-top-right rounded border border-border bg-background  text-sm text-foreground transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0 z-50"
      >
        {items.map((item, index) => (
          <MenuItem key={index}>
            <button
              onClick={item.onClick}
              className="z-[9999] hover:bg-muted-hover py-2 px-2 rounded w-full flex"
            >
              {item.label}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}

interface Props {
  children: React.ReactNode;
  items: Array<{ label: string; onClick: () => void }>;
  className?: string;
}
