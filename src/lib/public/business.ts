import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PublicBusiness = Tables<"businesses">;
export type PublicService = Tables<"services">;
export type PublicPortfolioItem = Tables<"portfolio_items">;
export type PublicWorkingHours = Tables<"working_hours">;

export async function getPublicBusiness(slug = "barbod-barber"): Promise<PublicBusiness | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Failed to load public business by slug", error.message);
    return null;
  }

  return data;
}

export async function getPublicServices(businessId: string): Promise<PublicService[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load public services", error.message);
    return [];
  }

  return data ?? [];
}

export async function getPublicPortfolio(businessId: string): Promise<PublicPortfolioItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public portfolio", error.message);
    return [];
  }

  return data ?? [];
}

export async function getPublicWorkingHours(businessId: string): Promise<PublicWorkingHours[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("working_hours")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to load public working hours", error.message);
    return [];
  }

  return data ?? [];
}
