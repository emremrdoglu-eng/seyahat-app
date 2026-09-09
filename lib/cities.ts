export type City = {
  name: string;
  lat: number;
  lon: number;
};

const cache = new Map<string, City[]>();

export async function fetchCitiesForCountry(
  countryCode: string
): Promise<City[]> {
  const cached = cache.get(countryCode);
  if (cached) return cached;

  try {
    const res = await fetch(`/data/cities/${countryCode}.json`);
    if (!res.ok) return [];
    const data = (await res.json()) as City[];
    cache.set(countryCode, data);
    return data;
  } catch {
    return [];
  }
}
