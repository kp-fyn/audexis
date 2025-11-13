import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import toast from "react-hot-toast";

export function useAutoUpdater() {
  useEffect(() => {
    let checkingForUpdates = false;

    async function checkForUpdates() {
      if (checkingForUpdates) return;
      checkingForUpdates = true;

      try {
        console.log("[Auto-Updater] Checking for updates...");

        const update = await check();
        console.log({ update });
        console.log("[Auto-Updater] Update check result:", update);

        if (update) {
          console.log("[Auto-Updater] Update available:", update.version);
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
                        toast.success(
                          "Update installed! Close and reopen app to apply."
                        );
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
        } else {
          console.log("[Auto-Updater] No update available");
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
}
