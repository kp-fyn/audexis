"use client";

import { useEffect, useState } from "react";
import { GitHubRelease } from "@/lib/github";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";

interface DownloadButtonProps {
  release: GitHubRelease | null;
}

export function DownloadButton({ release }: DownloadButtonProps) {
  const [os, setOs] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOs(window.navigator.platform);
    }
  }, []);

  if (!release) {
    return (
      <button
        disabled
        className="inline-flex gap-2 rounded-lg bg-muted px-8 py-4 text-lg font-semibold text-muted-foreground cursor-not-allowed"
      >
        Download Error
      </button>
    );
  }

  const dmgAsset = release.assets.find((a) => a.name.endsWith(".dmg"));
  const exeAsset = release.assets.find((a) => a.name.endsWith(".exe"));
  const macFileSize = dmgAsset
    ? (dmgAsset.size / (1024 * 1024)).toFixed(1)
    : "0";
  const windowsFileSize = exeAsset
    ? (exeAsset.size / (1024 * 1024)).toFixed(1)
    : "0";

  const isMac = os?.includes("Mac");
  const mainAsset = isMac ? dmgAsset : exeAsset;
  const altAsset = isMac ? exeAsset : dmgAsset;
  const mainFileSize = isMac ? macFileSize : windowsFileSize;

  return (
    <div className="flex flex-col justify-start">
      <a
        href={mainAsset?.browser_download_url}
        download
        className="inline-flex rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowDownTrayIcon className="h-6 w-6 mr-2" />
        Download for {isMac ? "macOS" : "Windows"}
      </a>

      <p className="text-sm text-muted-foreground">
        Version {release.tag_name} • {mainFileSize} MB • is{" "}
        {isMac ? "macOS 11+" : "Windows 10+"}
      </p>

      <Button asChild variant="link">
        <a download href={altAsset?.browser_download_url}>
          Download for {isMac ? "Windows" : "macOS"}
        </a>
      </Button>
    </div>
  );
}
