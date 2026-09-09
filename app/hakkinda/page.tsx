import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkında — Seyahat Mekanları",
};

export default function HakkindaPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-xl">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Hakkında
        </h1>

        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <p>
            Seyahat Mekanları, gezdiğin yerleri şehir ve kategoriye göre
            sıralayıp arkadaşlarınla paylaşabileceğin küçük bir uygulama.
          </p>
          <p>
            Ülke ve şehir seçim listelerindeki veriler{" "}
            <a
              href="https://www.geonames.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 underline dark:text-zinc-50"
            >
              GeoNames.org
            </a>{" "}
            kaynağından alınmıştır ve{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 underline dark:text-zinc-50"
            >
              CC BY 4.0
            </a>{" "}
            lisansı altında kullanılmaktadır.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Ana sayfaya dön
        </Link>
      </main>
    </div>
  );
}
