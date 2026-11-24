import { redirect } from "next/navigation";
import { createClient } from "@/shared/api/supabase/server";

export async function requireAdmin(redirectPath?: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = redirectPath
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : "/login";
    redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }
}
