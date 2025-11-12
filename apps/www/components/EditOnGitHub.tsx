"use client";

import { PencilIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

export function EditOnGitHub() {
  const pathname = usePathname();

  const githubPath = `apps/www/app${pathname}.mdx`;
  const githubUrl = `https://github.com/kp-fyn/audexis/edit/main/${githubPath}`;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <PencilIcon className="h-4 w-4" />
        Edit this page on GitHub
      </a>
    </div>
  );
}
