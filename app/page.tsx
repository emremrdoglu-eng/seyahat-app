"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthForm from "./AuthForm";

type Tier = "liked" | "ok" | "disliked";

type Place = {
  id: string;
  user_id: string;
  name: string;
  city: string;
  category: string;
  tier: Tier;
  sort_order: number;
};

type PendingPrompt = {
  place: Place;
  bucket: Place[];
};

type Comparison = {
  place: Place;
  bucket: Place[];
  lo: number;
  hi: number;
  round: number;
};

const CATEGORIES = [
  "Restoran",
  "Otel",
  "Kafe",
  "Gezilecek Yer",
  "Müze",
  "Diğer",
];

const TIERS: { key: Tier; label: string }[] = [
  { key: "liked", label: "Beğendim" },
  { key: "ok", label: "İdareydi" },
  { key: "disliked", label: "Beğenmedim" },
];

const TIER_ORDER: Record<Tier, number> = { liked: 0, ok: 1, disliked: 2 };

const TIER_BADGE_CLASSES: Record<Tier, string> = {
  liked:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ok: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  disliked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function normalizedCity(city: string) {
  return city.trim().toLocaleLowerCase("tr");
}

function bucketKey(city: string, category: string, tier: Tier) {
  return `${normalizedCity(city)}|${category}|${tier}`;
}

function tierLabel(tier: Tier) {
  return TIERS.find((t) => t.key === tier)!.label;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [places, setPlaces] = useState<Place[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(
    null
  );
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (!newSession) {
          setPlaces([]);
          setPendingPrompt(null);
          setComparison(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadPlaces() {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setPlaces(data ?? []);
  }

  useEffect(() => {
    if (!session) return;
    let ignore = false;

    supabase
      .from("places")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (ignore) return;
        if (error) setErrorMessage(error.message);
        else setPlaces(data ?? []);
      });

    return () => {
      ignore = true;
    };
  }, [session]);

  async function handleAdd(tier: Tier) {
    if (comparison || busy || !session) return;

    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    if (!trimmedName || !trimmedCity) return;

    const key = bucketKey(trimmedCity, category, tier);
    const bucket = places.filter(
      (p) => bucketKey(p.city, p.category, p.tier) === key
    );
    const initialSortOrder = bucket.length
      ? bucket[bucket.length - 1].sort_order + 1000
      : 1000;

    setBusy(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("places")
      .insert({
        user_id: session.user.id,
        name: trimmedName,
        city: trimmedCity,
        category,
        tier,
        sort_order: initialSortOrder,
      })
      .select()
      .single();

    if (error || !data) {
      setErrorMessage(error?.message ?? "Mekan eklenemedi.");
      setBusy(false);
      return;
    }

    await loadPlaces();
    setName("");
    setCity("");
    setCategory(CATEGORIES[0]);
    setPendingPrompt(bucket.length > 0 ? { place: data, bucket } : null);
    setBusy(false);
  }

  function handleStartCompare() {
    if (!pendingPrompt) return;
    setComparison({
      place: pendingPrompt.place,
      bucket: pendingPrompt.bucket,
      lo: 0,
      hi: pendingPrompt.bucket.length,
      round: 1,
    });
    setPendingPrompt(null);
  }

  function handleSkipPrompt() {
    setPendingPrompt(null);
  }

  async function handleChoose(winner: "new" | "existing") {
    if (!comparison || busy) return;

    const { place, bucket, lo, hi, round } = comparison;
    const mid = Math.floor((lo + hi) / 2);
    const nextLo = winner === "new" ? lo : mid + 1;
    const nextHi = winner === "new" ? mid : hi;

    if (nextLo < nextHi) {
      setComparison({ place, bucket, lo: nextLo, hi: nextHi, round: round + 1 });
      return;
    }

    let newSortOrder: number;
    if (nextLo <= 0) {
      newSortOrder = bucket[0].sort_order - 1000;
    } else if (nextLo >= bucket.length) {
      newSortOrder = bucket[bucket.length - 1].sort_order + 1000;
    } else {
      newSortOrder = (bucket[nextLo - 1].sort_order + bucket[nextLo].sort_order) / 2;
    }

    setBusy(true);
    const { error } = await supabase
      .from("places")
      .update({ sort_order: newSortOrder })
      .eq("id", place.id);

    if (error) setErrorMessage(error.message);
    await loadPlaces();
    setComparison(null);
    setBusy(false);
  }

  function handleCancelCompare() {
    setComparison(null);
  }

  async function handleDelete(id: string) {
    if (comparison || busy) return;
    setBusy(true);
    const { error } = await supabase.from("places").delete().eq("id", id);
    if (error) setErrorMessage(error.message);
    await loadPlaces();
    setPendingPrompt((current) =>
      current && current.place.id === id ? null : current
    );
    setBusy(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    if (!comparison) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handleChoose("new");
      else if (e.key === "ArrowRight") handleChoose("existing");
      else if (e.key === "Escape") handleCancelCompare();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparison]);

  const groups = (() => {
    const map = new Map<
      string,
      { city: string; category: string; items: Place[] }
    >();

    for (const place of places) {
      const key = `${normalizedCity(place.city)}|${place.category}`;
      if (!map.has(key)) {
        map.set(key, { city: place.city, category: place.category, items: [] });
      }
      map.get(key)!.items.push(place);
    }

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
        ),
      }))
      .sort((a, b) => {
        const cityDiff = a.city.localeCompare(b.city, "tr");
        return cityDiff !== 0
          ? cityDiff
          : a.category.localeCompare(b.category, "tr");
      });
  })();

  const mid = comparison
    ? Math.floor((comparison.lo + comparison.hi) / 2)
    : null;
  const opponent =
    comparison && mid !== null ? comparison.bucket[mid] : null;

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Yükleniyor...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Seyahat Mekanları
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {session.user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {errorMessage}
          </p>
        )}

        <form
          onSubmit={(e) => e.preventDefault()}
          className="mb-4 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Mekan Adı
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Ayasofya"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="city"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Şehir
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Örn. İstanbul"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="category"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Kategori
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nasıldı?
            </span>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={comparison !== null || busy}
                  onClick={() => handleAdd(t.key)}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {pendingPrompt && (
          <div className="mb-10 flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {pendingPrompt.place.name}
              </span>{" "}
              mekanını {pendingPrompt.place.city} · {pendingPrompt.place.category}{" "}
              · {tierLabel(pendingPrompt.place.tier)} içindeki diğer mekanlarla
              karşılaştırıp sıralamak ister misin?
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleSkipPrompt}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Atla
              </button>
              <button
                onClick={handleStartCompare}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Karşılaştır
              </button>
            </div>
          </div>
        )}

        <section className={`flex flex-col gap-8 ${pendingPrompt ? "" : "mt-10"}`}>
          {groups.length === 0 ? (
            <div>
              <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Eklenen Mekanlar
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Henüz mekan eklenmedi.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={`${normalizedCity(group.city)}|${group.category}`}>
                <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  {group.city} · {group.category}
                </h2>
                <ol className="flex flex-col gap-3">
                  {group.items.map((place, index) => (
                    <li
                      key={place.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3">
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
                      </div>
                      <button
                        onClick={() => handleDelete(place.id)}
                        disabled={comparison !== null || busy}
                        aria-label={`${place.name} mekanını sil`}
                        className="text-sm text-zinc-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ))
          )}
        </section>
      </main>

      {comparison && opponent && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 px-6 py-8 dark:bg-black">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {comparison.place.city} · {comparison.place.category} ·{" "}
                {tierLabel(comparison.place.tier)}
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {comparison.round}. Soru
              </p>
            </div>
            <button
              onClick={handleCancelCompare}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Atla
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <p className="text-xl font-medium text-zinc-900 dark:text-zinc-50">
              Hangisi daha iyi?
            </p>
            <div className="flex w-full max-w-3xl flex-col gap-4 sm:flex-row">
              <button
                onClick={() => handleChoose("new")}
                disabled={busy}
                className="flex h-56 flex-1 items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white px-6 text-center text-2xl font-semibold text-zinc-900 transition-colors hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-50"
              >
                {comparison.place.name}
              </button>
              <button
                onClick={() => handleChoose("existing")}
                disabled={busy}
                className="flex h-56 flex-1 items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white px-6 text-center text-2xl font-semibold text-zinc-900 transition-colors hover:border-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-50"
              >
                {opponent.name}
              </button>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              ← / → ok tuşlarıyla da seçebilirsin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
