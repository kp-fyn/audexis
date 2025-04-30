import { Check } from "lucide-react";

import { ReactNode } from "react";
import { getAllColumns } from "@renderer/lib/utils";
import { useUserConfig } from "@renderer/hooks/useUserConfig";

export default function ColumnContextMenu({ selected }: { selected: string }): ReactNode {
  const { config, setColumns } = useUserConfig();
  const allColumns = getAllColumns();
  return (
    <div className="z-[99999999]">
      {allColumns.map((column) => (
        <div key={column.value}>
          {config.columns.find((c) => c.value === column.value) ? (
            <div
              onClick={() => {
                const index = config.columns.findIndex((c) => c.value === column.value);
                if (index === -1) return;

                const newColumns = [
                  ...config.columns.slice(0, index),
                  ...config.columns.slice(index + 1),
                ];
                setColumns(newColumns);
              }}
              className="relative flex cursor-default select-none items-center rounded-sm py-1.5  pl-4 pr-2 text-sm outline-none hover:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <Check className="mr-2 h-4 w-4" />
              {column.label}
            </div>
          ) : (
            <div
              onClick={() => {
                if (selected === "__nun") {
                  const index = 0;
                  const newColumns = [
                    ...config.columns.slice(0, index),
                    {
                      label: column.label,
                      value: column.value,
                      size: 200,
                    },
                    ...config.columns.slice(index),
                  ];

                  setColumns(newColumns);
                } else {
                  const index = config.columns.findIndex((c) => c.value === selected);
                  if (index === -1) return;
                  const exists = config.columns.find((c) => c.value === column.value);
                  if (exists) return;
                  const newColumns = [
                    ...config.columns.slice(0, index),
                    {
                      label: column.label,
                      value: column.value,
                      size: 200,
                    },
                    ...config.columns.slice(index),
                  ];

                  setColumns(newColumns);
                }
              }}
              className="relative flex cursor-default select-none items-center rounded-sm py-1.5  pl-4 pr-2 text-sm outline-none hover:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              {column.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
