import DocsSidebar from "../../components/DocsSidebar";
import TableOfContents from "../../components/TableOfContents";
import { EditOnGitHub } from "../../components/EditOnGitHub";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background mx-auto max-w-7xl">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <aside className="lg:col-span-3 xl:col-span-3">
            <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-8">
              <DocsSidebar />
            </div>
          </aside>

          <main className="docs  l lg:col-span-9 xl:col-span-7 min-w-0">
            <div className="prose prose-slate dark:prose-invert ">
              {children}
            </div>
            <EditOnGitHub />
          </main>

          <div className="hidden xl:block xl:col-span-2">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pb-8">
              <TableOfContents />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
