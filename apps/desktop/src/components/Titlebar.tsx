export default function Titlebar() {
  return (
    <div
      data-tauri-drag-region={true}
      className="z-99 bg-background border-b border-border fixed h-8 top-0 w-full"
    ></div>
  );
}
