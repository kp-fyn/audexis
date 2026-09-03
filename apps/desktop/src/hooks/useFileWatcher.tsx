import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";

export type DatabaseMediaFile = {
  id: number;
  path: string;
  file_name: string;
  last_validated: number;
  status: string;
  duration_ms: number | null;
  format: string | null;
  modified_at: number;
  size: number;
};

interface NormalizedMediaFiles {
  byId: Record<number, DatabaseMediaFile>;
  allIds: number[];
}

export function useFileWatcher() {
  const queryClient = useQueryClient();
  const queryKey = ["fileWatcherMap"];

  const query = useQuery<NormalizedMediaFiles>({
    queryKey,
    queryFn: async () => {
      const files = await invoke<DatabaseMediaFile[]>("get_files");

      const byId: Record<number, DatabaseMediaFile> = {};
      const allIds: number[] = new Array(files.length);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        byId[file.id] = file;
        allIds[i] = file.id;
      }

      return { byId, allIds };
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function setupListener() {
      unlisten = await listen("file-", (event) => {});
    }

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [queryClient]);

  return query;
}
