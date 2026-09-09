import { supabase } from "@/lib/supabaseClient";
import type { Place } from "@/lib/places";

export type PublicGuideData = {
  username: string;
  places: Place[];
};

export async function getPublicGuideData(
  username: string
): Promise<PublicGuideData | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();

  if (!profile) return null;

  const { data: places } = await supabase
    .from("places")
    .select("*")
    .eq("user_id", profile.id)
    .order("sort_order", { ascending: true });

  return { username: profile.username, places: (places ?? []) as Place[] };
}
