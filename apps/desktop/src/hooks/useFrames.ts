import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  SerializableTagFrame,
  SerializableTagFrameValue,
} from "@/ui/types";

export type FramesByPath = Record<string, SerializableTagFrame[]>;
export type FrameMapByPath = Record<
  string,
  Record<string, SerializableTagFrameValue[]>
>;

export function useFrames(paths: string[]) {
  const [framesByPath, setFramesByPath] = useState<FramesByPath>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (overridePaths?: string[]) => {
      const req = overridePaths ?? paths;
      if (!req || req.length === 0) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = (await invoke("get_frames", { paths: req })) as Array<{
          path: string;
          frames: SerializableTagFrame[];
        }>;
        const map: FramesByPath = {};
        for (const item of result) {
          map[item.path] = item.frames || [];
        }
        setFramesByPath(map);
      } catch (e) {
        setError(
          typeof e === "string" ? e : (e as any)?.message ?? "Unknown error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [paths]
  );

  useEffect(() => {
    refresh(paths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(paths)]);

  const asMap: FrameMapByPath = useMemo(() => {
    const out: FrameMapByPath = {} as any;
    for (const [p, arr] of Object.entries(framesByPath)) {
      const m: Record<string, SerializableTagFrameValue[]> = {};
      for (const f of arr) {
        m[f.key] = f.values;
      }
      out[p] = m;
    }
    return out;
  }, [framesByPath]);

  return {
    framesByPath,
    framesMapByPath: asMap,
    isLoading,
    error,
    refresh,
  };
}
