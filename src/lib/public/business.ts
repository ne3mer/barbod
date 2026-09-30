import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PublicBusiness = Tables<"businesses">;
export type PublicBarber = Tables<"barbers">;
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

export async function getPublicBarbers(businessId: string): Promise<PublicBarber[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load public barbers", error.message);
    return [];
  }

  return data ?? [];
}

export async function getPublicBarberServicesMap(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("barber_services")
    .select("barber_id, service_id");

  if (error) {
    console.error("Failed to load barber_services map", error.message);
    return {};
  }

  const map: Record<string, string[]> = {};
  for (const item of data ?? []) {
    if (!map[item.barber_id]) map[item.barber_id] = [];
    map[item.barber_id].push(item.service_id);
  }
  return map;
}

export async function getPublicBarberServices(barberId: string, businessId: string): Promise<PublicService[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barber_services")
    .select("service_id, services(*)")
    .eq("barber_id", barberId);

  if (error) {
    console.error("Failed to load barber services", error.message);
    return [];
  }

  const services = (data ?? [])
    .map((item) => item.services)
    .filter(
      (svc): svc is PublicService =>
        svc !== null && svc.business_id === businessId && svc.is_active === true
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  return services;
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

export async function getPublicPortfolio(businessId: string, barberId?: string): Promise<PublicPortfolioItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("portfolio_items")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_visible", true);

  if (barberId) {
    query = query.eq("barber_id", barberId);
  }

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public portfolio", error.message);
    return [];
  }

  return data ?? [];
}

export async function getPublicWorkingHours(businessId: string, barberId?: string): Promise<PublicWorkingHours[]> {
  const supabase = await createClient();

  let query = supabase
    .from("working_hours")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (barberId) {
    query = query.eq("barber_id", barberId);
  }

  const { data, error } = await query
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to load public working hours", error.message);
    return [];
  }

  return data ?? [];
}
