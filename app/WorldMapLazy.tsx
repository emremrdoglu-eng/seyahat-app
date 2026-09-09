"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/places";

const WorldMap = dynamic(() => import("./WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
      Harita yükleniyor...
    </div>
  ),
});

type Props = {
  places: Place[];
};

export default function WorldMapLazy({ places }: Props) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={containerRef}>
      {visible ? (
        <WorldMap places={places} />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Harita yükleniyor...
        </div>
      )}
    </div>
  );
}
