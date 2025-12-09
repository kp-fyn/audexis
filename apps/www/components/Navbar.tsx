import { ThemeToggle } from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { getDocsGroups } from "@/app/docs/registry";
import { DownloadButton } from "./DownloadButton";
import { getLatestRelease } from "@/lib/github";

export default async function Navbar() {
  const groups = await getDocsGroups();
  const release = await getLatestRelease();

  return (
    <header className="fixed w-full top-0 z-50 border-b border-border  bg-background/80 backdrop-blur-md py-1">
      <div className="mx-auto px-4 md:px-12  lg:px-32  h-14 flex items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-2xl">
            Audexis
          </Link>
          <nav className="hidden text-muted-foreground lg:flex items-center gap-4 text-sm">
            <Link href="/docs">Docs</Link>
            <a
              href="https://github.com/kp-fyn/audexis"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="hidden md:flex   ml-auto lg:w-xl">
          <SearchBar groups={groups} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="md:hidden">
            <SearchBar groups={groups} />
          </div>
          <ThemeToggle />
          <div className="py-6">
            <DownloadButton release={release} />
          </div>
        </div>
      </div>
    </header>
  );
}
