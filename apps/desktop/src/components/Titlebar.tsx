export default function Titlebar() {
  return (
    <div
      data-tauri-drag-region={true}
      className="z-9999999 bg-background border-b border-border fixed h-14 top-0 w-full"
    ></div>
  );
}
