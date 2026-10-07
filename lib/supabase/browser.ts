import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components. Use only for auth UI and direct storage uploads. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
