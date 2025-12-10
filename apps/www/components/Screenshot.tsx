"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

export default function Screenshot({
  src,
  alt,
  width,
  height,
  className,
}: ScreenshotProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="  h-full w-full   flex">
      <Image
        src={`${src}-${theme || "light"}.png`}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority
      />
    </div>
  );
}

interface ScreenshotProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}
