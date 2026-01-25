import { createContext, useEffect } from "react";
import toast from "react-hot-toast";
import { invoke } from "@tauri-apps/api/core";
import { useChanges } from "./useChanges";

export function useAutoUpdater() {}
const AutoUpdaterContext = createContext<null>(null);

export function AutoUpdaterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { changes } = useChanges();
  useEffect(() => {
    let checkingForUpdates = false;

    async function checkForUpdates() {
      if (checkingForUpdates) return;
      checkingForUpdates = true;

      try {
        let hasUpdate = await invoke("check_update");

        if (hasUpdate) {
          toast(
            (t) => (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Update Available!</div>
                <div className="text-sm">
                  There is an update ready to install
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      if (Object.keys(changes).length > 0) {
                        toast.dismiss(t.id);
                        toast.error(
                          "Please save or discard your changes before updating.",
                        );
                        return;
                      }
                      toast.dismiss(t.id);
                      toast.loading("Downloading update...");

                      try {
                        await invoke("update_app");
                        toast.dismiss();
                      } catch (error) {
                        toast.dismiss();
                        toast.error(`Update failed: ${error}`);
                      }
                    }}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Install Now
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1 bg-muted text-foreground rounded hover:bg-muted/90"
                  >
                    Later
                  </button>
                </div>
              </div>
            ),
            {
              id: "update-available",
              duration: Infinity,
            },
          );
        }
      } catch (error) {
        console.error("[Auto-Updater] Update check failed:", error);
      } finally {
        checkingForUpdates = false;
      }
    }

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    (window as any).checkForUpdates = checkForUpdates;

    return () => {
      clearInterval(interval);
      delete (window as any).checkForUpdates;
    };
  }, []);
  return (
    <AutoUpdaterContext.Provider value={null}>
      {children}
    </AutoUpdaterContext.Provider>
  );
}
