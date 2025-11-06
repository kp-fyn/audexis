declare module "is-hotkey" {
  type KbEvent = KeyboardEvent | import("react").KeyboardEvent;
  type IsHotkeyFn = (hotkey: string | string[], event: KbEvent) => boolean;
  interface IsHotkeyModule {
    (hotkey: string | string[], event: KbEvent): boolean;
    isHotkey: IsHotkeyFn;
    createShortcut: (hotkey: string | string[]) => (event: KbEvent) => boolean;
  }
  const isHotkey: IsHotkeyModule;
  export default isHotkey;
}
