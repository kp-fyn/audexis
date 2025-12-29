import { ThemeToggle } from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { getDocsGroups } from "@/app/docs/registry";
import { DownloadButton } from "./DownloadButton";
import { getLatestRelease } from "@/lib/github";
import { getBlogGroups } from "@/app/blog/registry";

export default async function Navbar() {
  const groups = [...(await getDocsGroups()), ...(await getBlogGroups())];
  const release = await getLatestRelease();

  return (
    <header className="fixed w-full top-0 z-50 border-b border-border  bg-background/80 backdrop-blur-md py-1">
      <div className="mx-auto px-4 md:px-12  lg:px-32  h-14 flex items-center gap-4">
        <div className="flex  items-center gap-4">
          <Link href="/" className="font-semibold text-2xl">
            Audexis
          </Link>
          <nav className=" text-muted-foreground  flex  items-center gap-2 text-sm">
            <Link
              className="hover:text-primary transition-colors duration-300"
              href="/docs"
            >
              Docs
            </Link>
            <Link
              className="hover:text-primary transition-colors duration-300"
              href="/blog"
            >
              Blog
            </Link>
            <a
              className="hover:text-primary transition-colors duration-300"
              href="https://github.com/kp-fyn/audexis"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="hidden lg:flex self-center lg:mx-auto ml-auto lg:w-lg">
          <SearchBar groups={groups} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex lg:hidden  lg:w-lg">
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
