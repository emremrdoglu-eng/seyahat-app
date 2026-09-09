"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES, type Country } from "@/lib/countries";

type Props = {
  value: Country | null;
  onChange: (country: Country | null) => void;
};

export default function CountrySelect({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.tr ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value?.tr ?? "");
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, value]);

  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const results =
    normalizedQuery === ""
      ? COUNTRIES
      : COUNTRIES.filter(
          (c) =>
            c.tr.toLocaleLowerCase("tr").includes(normalizedQuery) ||
            c.code.toLowerCase().includes(normalizedQuery)
        );

  function handleSelect(country: Country) {
    onChange(country);
    setQuery(country.tr);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label
        htmlFor="country"
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Ülke
      </label>
      <div className="relative">
        <input
          id="country"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={(e) => {
            setOpen(true);
            e.target.select();
          }}
          placeholder="Ülke ara..."
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-8 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Ülke seçimini temizle"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute top-full z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              Sonuç bulunamadı
            </li>
          ) : (
            results.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(country)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  <span>{country.tr}</span>
                  <span className="text-xs text-zinc-400">
                    {country.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
