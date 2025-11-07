export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
  }[];
}

export async function getLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/kp-fyn/audexis/releases/latest",
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch latest release:", error);
    return null;
  }
}

export function getDownloadUrl(release: GitHubRelease | null): string | null {
  if (!release) return null;

  const dmgAsset = release.assets.find((asset) => asset.name.endsWith(".dmg"));

  return dmgAsset?.browser_download_url || null;
}

export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}
