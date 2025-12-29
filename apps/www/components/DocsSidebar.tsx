import { getDocsGroups } from "@/app/docs/registry";
import DocsSidebarClient from "@/components/DocsSidebarClient";

export default async function DocsSidebar() {
  const groups = await getDocsGroups();

  return (
    <nav className="space-y-4">
      <div className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-primary rounded-full" />
            <div>
              <div className="text-sm font-bold text-foreground">
                Documentation
              </div>
              <div className="text-[11px] text-muted-foreground">Audexis</div>
            </div>
          </div>
          <DocsSidebarClient groups={groups} mode="mobile-toggle" />
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="flex items-center gap-2 px-3 mb-4">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <div>
            <div className="text-lg font-bold text-foreground">
              Documentation
            </div>
            <div className="text-xs text-muted-foreground">Audexis</div>
          </div>
        </div>
        <DocsSidebarClient groups={groups} />
      </div>
    </nav>
  );
}
