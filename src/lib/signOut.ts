import { getSupabase } from "@/lib/supabase";

export async function signOutBespken() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}
