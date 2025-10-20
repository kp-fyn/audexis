import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import toast from "react-hot-toast";

export function useAutoUpdater() {
  useEffect(() => {
    let checkingForUpdates = false;

    async function checkForUpdates() {
      if (checkingForUpdates) return;
      checkingForUpdates = true;

      try {
        const update = await check();

        if (update?.available) {
          toast(
            (t) => (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">Update Available!</div>
                <div className="text-sm">
                  Version {update.version} is ready to install
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      toast.dismiss(t.id);
                      toast.loading("Downloading update...");

                      try {
                        await update.downloadAndInstall();
                        toast.dismiss();
                        toast.success("Update installed! Restarting...");

                        setTimeout(async () => {
                          await relaunch();
                        }, 1000);
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
              duration: Infinity,
            }
          );
        }
      } catch (error) {
        console.error("Update check failed:", error);
      } finally {
        checkingForUpdates = false;
      }
    }

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
