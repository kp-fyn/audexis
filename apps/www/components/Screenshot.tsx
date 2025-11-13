"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

export default function Screenshot() {
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
        src={`/screenshot-${theme || "dark"}.png`}
        alt="Audexis Screenshot"
        width={1200}
        height={700}
        className="max-w-full rounded"
        priority
      />
    </div>
  );
}
