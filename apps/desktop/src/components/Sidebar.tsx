import { ReactNode, useEffect, useRef, useState } from "react";
import { useSidebarWidth } from "@/ui/hooks/useSidebarWidth";
import useWindowDimensions from "@/ui/hooks/useWindowDimensions";
// import EditMenu from "./EditMenu";
// import { useUserConfig } from "../hooks/useUserConfig";
// import Filetree from "./Filetree";
import {
  Home,
  Radio,
  Library,
  ListMusic,
  Flame,
  Sparkles,
  Compass,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  Search,
  PlusCircle,
  Clock,
} from "lucide-react";
export default function Sidebar(): ReactNode {
  const [activeTab, setActiveTab] = useState("playlists");
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  // const { config } = useUserConfig();

  const { width } = useWindowDimensions();

  const startResizing = (): void => {
    isResizing.current = true;
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (event: MouseEvent): void => {
    if (isResizing.current && sidebarRef.current) {
      const newWidth = event.clientX;
      const minWidth = 0;
      const maxWidth = window.innerWidth - 200;
      document.body.style.userSelect = "none";

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const stopResizing = (): void => {
    isResizing.current = false;
    document.body.style.userSelect = "";

    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };

  // const { src } = useImage({
  //   srcList: [image?.url ?? "../assets/images/unknown.jpg"]
  // });
  useEffect(() => {
    if (sidebarWidth > width - 200) {
      setSidebarWidth(width - 200);
    }
  }, [width, sidebarWidth]);

  return (
    <div
      ref={sidebarRef}
      tabIndex={1}
      style={{
        width: `${sidebarWidth}px`,
        top: 0,
        maxWidth: `${width - 200}px`,
      }}
      className="fixed bg-background shadow-2xl select-none z-19999999 top-0 left-0 h-screen border-r border-border text-foreground overflow-y-none overflow-x-clip"
    >
      <div data-tauri-drag-region={true} className="h-14" />
      <div className="sidebar px-4 h-full">
        <div className="space-y-6">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("listen-now")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "listen-now"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-foreground hover:bg-hover hover:text-hover-foreground"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Listen Now</span>
            </button>

            <button
              onClick={() => setActiveTab("browse")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "browse"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-foreground hover:bg-hover hover:text-hover-foreground"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Browse</span>
            </button>

            <button
              onClick={() => setActiveTab("radio")}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "radio"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-foreground hover:bg-hover hover:text-hover-foreground"
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Radio</span>
            </button>
          </nav>

          <nav className="space-y-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Library
            </p>
          </nav>
        </div>
        <div
          style={{ left: `${sidebarWidth}px`, width: "0.25px" }}
          className="fixed top-0 bottom-0 h-full cursor-col-resize bg-border hover:bg-border"
          onMouseDown={startResizing}
        ></div>
      </div>
    </div>
  );
}
