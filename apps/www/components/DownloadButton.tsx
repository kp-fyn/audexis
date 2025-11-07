"use client";

import { GitHubRelease } from "@/lib/github";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface DownloadButtonProps {
  release: GitHubRelease | null;
}

export function DownloadButton({ release }: DownloadButtonProps) {
  if (!release) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-lg bg-muted px-8 py-4 text-lg font-semibold text-muted-foreground cursor-not-allowed"
      >
        Download Coming Soon
      </button>
    );
  }

  const dmgAsset = release.assets.find((asset) => asset.name.endsWith(".dmg"));
  const fileSize = dmgAsset ? (dmgAsset.size / (1024 * 1024)).toFixed(1) : "0";

  return (
    <div className="flex flex-col items-center gap-4">
      <a
        href={dmgAsset?.browser_download_url}
        download
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowDownTrayIcon className="h-6 w-6" />
        Download for macOS
      </a>
      <p className="text-sm text-muted-foreground">
        Version {release.tag_name} • {fileSize} MB • macOS 11+
      </p>
    </div>
  );
}
