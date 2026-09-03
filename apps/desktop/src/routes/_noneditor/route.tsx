import { createFileRoute, Outlet } from "@tanstack/react-router";
import Sidebar from "../../components/Sidebar";
import NowPlaying from "../../components/NowPlaying";

export const Route = createFileRoute("/_noneditor")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-full w-full">
      <Sidebar />
      <div className="ml-60">
        <Outlet />
        <NowPlaying />
      </div>
    </div>
  );
}
