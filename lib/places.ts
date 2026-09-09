export type Tier = "liked" | "ok" | "disliked";

export type Place = {
  id: string;
  user_id: string;
  name: string;
  city_name: string;
  category: string;
  tier: Tier;
  sort_order: number;
  country_code: string | null;
  country_name: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PlaceGroup = {
  city_name: string;
  category: string;
  items: Place[];
};

export const CATEGORIES = [
  "Restoran",
  "Otel",
  "Kafe",
  "Gezilecek Yer",
  "Müze",
  "Diğer",
];

export const TIERS: { key: Tier; label: string }[] = [
  { key: "liked", label: "Beğendim" },
  { key: "ok", label: "İdareydi" },
  { key: "disliked", label: "Beğenmedim" },
];

export const TIER_ORDER: Record<Tier, number> = { liked: 0, ok: 1, disliked: 2 };

export const TIER_BADGE_CLASSES: Record<Tier, string> = {
  liked:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ok: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  disliked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export function normalizedCity(cityName: string) {
  return cityName.trim().toLocaleLowerCase("tr");
}

export function bucketKey(cityName: string, category: string, tier: Tier) {
  return `${normalizedCity(cityName)}|${category}|${tier}`;
}

export function tierLabel(tier: Tier) {
  return TIERS.find((t) => t.key === tier)!.label;
}

export function groupPlaces(places: Place[]): PlaceGroup[] {
  const map = new Map<string, PlaceGroup>();

  for (const place of places) {
    const key = `${normalizedCity(place.city_name)}|${place.category}`;
    if (!map.has(key)) {
      map.set(key, {
        city_name: place.city_name,
        category: place.category,
        items: [],
      });
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
      const cityDiff = a.city_name.localeCompare(b.city_name, "tr");
      return cityDiff !== 0
        ? cityDiff
        : a.category.localeCompare(b.category, "tr");
    });
}

const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username);
}
