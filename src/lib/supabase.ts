import { createClient } from "@supabase/supabase-js";

/**
 * Portable Supabase client for the EXISTING LS Services project (shared with
 * the mobile app). No Lovable-specific infrastructure is used anywhere.
 * The anon/publishable key is safe to ship in client code; RLS protects data.
 */
const SUPABASE_URL =
  (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ??
  "https://aihnpdxpzwlhxfmyjmfa.supabase.co";

const SUPABASE_ANON_KEY =
  (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaG5wZHhwendsaHhmbXlqbWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzA5NDYsImV4cCI6MjEwMDIwNjk0Nn0.SO8LOnAqUFmsQJ-meA3zPVlDN6JU6kJPRW1WAyfJsHw";

const isBrowser = typeof window !== "undefined";

export const supabase = createClient(SUPABASE_URL.replace(/\/rest\/v1\/?$/, ""), SUPABASE_ANON_KEY, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
});
