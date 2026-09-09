import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { groupPlaces, TIER_BADGE_CLASSES, tierLabel } from "@/lib/places";
import { getPublicGuideData } from "./data";
import ShareButton from "./ShareButton";
import WorldMapLazy from "../../WorldMapLazy";

type Props = {
  params: Promise<{ kullanici: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kullanici } = await params;
  const data = await getPublicGuideData(kullanici);

  if (!data) {
    return { title: "Rehber bulunamadı" };
  }

  const cityCount = new Set(data.places.map((p) => p.city_name)).size;
  const title = `${data.username} — Seyahat Rehberi`;
  const description =
    data.places.length > 0
      ? `${data.places.length} mekan · ${cityCount} şehir`
      : "Henüz mekan eklenmedi";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RehberPage({ params }: Props) {
  const { kullanici } = await params;
  const data = await getPublicGuideData(kullanici);

  if (!data) notFound();

  const groups = groupPlaces(data.places);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {data.username}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Seyahat Rehberi
            </p>
          </div>
          <ShareButton />
        </div>

        <div className="mb-8">
          <WorldMapLazy places={data.places} />
        </div>

        <section className="flex flex-col gap-8">
          {groups.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Henüz mekan eklenmedi.
            </p>
          ) : (
            groups.map((group) => (
              <div key={`${group.city_name}|${group.category}`}>
                <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  {group.city_name} · {group.category}
                </h2>
                <ol className="flex flex-col gap-3">
                  {group.items.map((place, index) => (
                    <li
                      key={place.id}
                      className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {index + 1}
                      </span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {place.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIER_BADGE_CLASSES[place.tier]}`}
                      >
                        {tierLabel(place.tier)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))
          )}
        </section>

        <p className="mt-10 text-center">
          <Link
            href="/hakkinda"
            className="text-xs text-zinc-400 underline hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-500"
          >
            Hakkında
          </Link>
        </p>
      </main>
    </div>
  );
}
