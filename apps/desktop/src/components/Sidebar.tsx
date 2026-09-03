import { useRouterState } from "@tanstack/react-router";
import { cn } from "../utils";

export default function Sidebar() {
  const router = useRouterState();
  const links = [
    {
      label: "",
      children: [
        {
          name: "Home",
          path: "/",
        },
        {
          name: "Search",
          path: "/search",
        },
        {
          name: "Tag Manager",
          path: "/tagmanager",
        },
      ],
    },
    {
      label: "Library",
      children: [
        {
          name: "Artists",
          path: "/artists",
        },
        {
          name: "Albums",
          path: "/albums",
        },
        {
          name: "Songs",
          path: "/songs",
        },
      ],
    },
  ];
  console.log(router.location.pathname);
  return (
    <div className="h-full    z-100 w-60  fixed">
      <div className="h-2" data-tauri-drag-region={true}></div>
      <div className="pb-4 h-full">
        <div className=" mx-2 bg-popover rounded-xl h-full">
          <div data-tauri-drag-region={true} className="h-12"></div>
          <div className="px-2">
            {links.map(({ label, children }) => {
              return (
                <div className="py-4">
                  <span className="uppercase text-[11px] text-muted-foreground">
                    {label}
                  </span>
                  <div className="px-2 flex flex-col ">
                    {children.map((child) => {
                      const isActive = router.location.pathname === child.path;
                      return (
                        <div
                          className={cn(
                            "hover:text-primary font-light text-[15px] hover:cursor-default rounded-lg transition-all duration-100 py-2 px-2 ",
                            {
                              "text-primary bg-active": isActive,
                            },
                          )}
                        >
                          {child.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
