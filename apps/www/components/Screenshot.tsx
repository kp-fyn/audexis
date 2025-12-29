import Image from "next/image";

interface ScreenshotProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fetchPriority?: "high" | "low" | "auto";
}

export default function Screenshot({
  src,
  alt,
  width,
  height,
  className,
  fetchPriority = "auto",
}: ScreenshotProps) {
  return (
    <div className="h-full w-full flex">
      <Image
        src={`${src}-light.png`}
        alt={alt}
        width={width}
        height={height}
        fetchPriority={fetchPriority}
        className={`${className} dark:hidden`}
        priority
        sizes="(min-width: 1280px) 1200px, (min-width: 768px) 90vw, 100vw"
      />
      <Image
        src={`${src}-dark.png`}
        alt={alt}
        width={width}
        height={height}
        fetchPriority={fetchPriority}
        className={`${className} hidden dark:block`}
        priority
        sizes="(min-width: 1280px) 1200px, (min-width: 768px) 90vw, 100vw"
      />
    </div>
  );
}
