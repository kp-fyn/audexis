"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Screenshot() {
  const { resolvedTheme } = useTheme();
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
          src={`/screenshot-${resolvedTheme || "dark"}.png`}
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
