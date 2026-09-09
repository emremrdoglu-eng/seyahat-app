"use client";

import { useEffect, useRef, useState } from "react";
import { fetchCitiesForCountry, type City } from "@/lib/cities";

type Coords = { lat: number; lon: number };

type Props = {
  countryCode: string | null;
  value: string;
  onChange: (name: string, coords: Coords | null) => void;
};

export default function CitySelect({ countryCode, value, onChange }: Props) {
  const [cities, setCities] = useState<City[]>([]);
  const [loadedCode, setLoadedCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loading = countryCode !== null && countryCode !== loadedCode;

  useEffect(() => {
    if (!countryCode || countryCode === loadedCode) return;
    let ignore = false;

    fetchCitiesForCountry(countryCode).then((data) => {
      if (ignore) return;
      setCities(data);
      setLoadedCode(countryCode);
    });

    return () => {
      ignore = true;
    };
  }, [countryCode, loadedCode]);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const normalizedQuery = value.trim().toLocaleLowerCase("tr");
  const results =
    !countryCode || cities.length === 0
      ? []
      : (normalizedQuery === ""
          ? cities
          : cities.filter((c) =>
              c.name.toLocaleLowerCase("tr").includes(normalizedQuery)
            )
        ).slice(0, 50);

  const showCustomOption =
    countryCode &&
    normalizedQuery !== "" &&
    !cities.some((c) => c.name.toLocaleLowerCase("tr") === normalizedQuery);

  function handleSelect(city: City) {
    onChange(city.name, { lat: city.lat, lon: city.lon });
    setOpen(false);
  }

  function handleUseCustom() {
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label
        htmlFor="city"
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Şehir
      </label>
      <input
        id="city"
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value, null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Örn. İstanbul"
        autoComplete="off"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />

      {open && countryCode && (
        <ul className="absolute top-full z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
          {loading ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              Yükleniyor...
            </li>
          ) : (
            <>
              {results.map((city) => (
                <li key={city.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(city)}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {city.name}
                  </button>
                </li>
              ))}
              {showCustomOption && (
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleUseCustom}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    &ldquo;{value}&rdquo; olarak devam et (listede yok)
                  </button>
                </li>
              )}
              {results.length === 0 && !showCustomOption && (
                <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Sonuç bulunamadı
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
