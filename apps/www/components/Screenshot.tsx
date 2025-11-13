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
    <section className="w-full px-8 py-16">
      <div className="relative w-full aspect-video rounded-[10.5    rem] overflow-hidden">
        <Image
          src={`/screenshot-${theme || "dark"}.png`}
          alt="Audexis Screenshot"
          fill
          sizes="100vw"
          className="object-contain r"
          priority
        />
      </div>
    </section>
  );
}
