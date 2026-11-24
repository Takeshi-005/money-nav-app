import type { SupabaseClient } from "@supabase/supabase-js";

export async function grantExperience(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<void> {
  if (amount <= 0) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("experience")
    .eq("id", userId)
    .single();

  await supabase
    .from("profiles")
    .update({ experience: (profile?.experience ?? 0) + amount })
    .eq("id", userId);
}
