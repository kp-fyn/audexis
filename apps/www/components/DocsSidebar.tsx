import { getDocsGroups } from "@/app/docs/registry";
import DocsSidebarClient from "@/components/DocsSidebarClient";

export default async function DocsSidebar() {
  const groups = await getDocsGroups();
  return (
    <nav className="space-y-4">
      <div className="flex items-center gap-2 px-3 mb-6">
        <div className="h-8 w-1 bg-primary rounded-full" />
        <div>
          <div className="text-lg font-bold text-foreground">Documentation</div>
          <div className="text-xs text-muted-foreground">Audexis</div>
        </div>
      </div>

      <DocsSidebarClient groups={groups} />
    </nav>
  );
}
