import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { invoke } from "@tauri-apps/api/core";
import { useSidebarWidth } from "./hooks/useSidebarWidth";
import MusicPlayer from "./MusicPlayer";

export default function App() {
  useEffect(() => {
    setTimeout(() => {
      invoke("get_files").then((files) => {
        console.log({ files });
      });
      // dont touch also gets important stuff
      invoke("get_workspace_files");

      invoke("get_workspace_root").catch(() => {});
    }, 1000);
  }, []);
  const { sidebarWidth } = useSidebarWidth();
  useEffect(() => {}, []);
  return (
    <div className="ssda h-full w-full bg-transparent">
      <Sidebar />
      <main
        style={{ marginLeft: `${sidebarWidth}px` }}
        className="w-full h-full py-20 px-"
      >
        <div className=""></div>
      </main>
    </div>
  );
}
