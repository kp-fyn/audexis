import { createFileRoute } from "@tanstack/react-router";
import { useFileWatcher } from "../../hooks/useFileWatcher";

export const Route = createFileRoute("/_noneditor/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: files } = useFileWatcher();
  console.log(files);
  return (
    <div>
      <div>move</div>
    </div>
  );
}
