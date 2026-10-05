import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import {
  DEMO_BUSINESS,
  DEMO_BARBERS,
  DEMO_SERVICES,
  DEMO_PORTFOLIO,
  DEMO_WORKING_HOURS,
} from "@/lib/config/demo-content";

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

  if (error || !data) {
    console.error("Failed to load public business by slug", error?.message);
    // Return high-quality demo business fallback
    return {
      id: "dc7cca34-20ea-47f5-a579-12b90f9003bb",
      owner_id: "2bdf4ebb-54bf-42c5-a39e-5216a05b6759",
      name: DEMO_BUSINESS.name,
      slug: DEMO_BUSINESS.slug,
      description_en: DEMO_BUSINESS.descriptionEn,
      description_hu: DEMO_BUSINESS.descriptionHu,
      phone: DEMO_BUSINESS.phone,
      email: DEMO_BUSINESS.email,
      address: `${DEMO_BUSINESS.address}, ${DEMO_BUSINESS.district}`,
      instagram_url: DEMO_BUSINESS.instagramUrl,
      logo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Ensure fields are rich and realistic if placeholder values exist
  return {
    ...data,
    name: data.name || DEMO_BUSINESS.name,
    description_en: data.description_en || DEMO_BUSINESS.descriptionEn,
    description_hu: data.description_hu || DEMO_BUSINESS.descriptionHu,
    phone: data.phone?.length && !data.phone.includes("201930123") ? data.phone : DEMO_BUSINESS.phone,
    email: data.email?.includes("@") && !data.email.includes("nasjdj") ? data.email : DEMO_BUSINESS.email,
    address: data.address && !data.address.includes("asldkl") ? data.address : `${DEMO_BUSINESS.address}, ${DEMO_BUSINESS.district}`,
    instagram_url: data.instagram_url || DEMO_BUSINESS.instagramUrl,
  };
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

  if (error || !data || data.length === 0) {
    if (error) console.error("Failed to load public barbers", error.message);
    return DEMO_BARBERS.map((b) => ({
      id: b.id,
      business_id: businessId,
      user_id: null,
      name: b.name,
      profile_photo_url: b.photoUrl,
      bio_en: b.bioEn,
      bio_hu: b.bioHu,
      is_active: true,
      display_order: b.displayOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  return data;
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

  if (error || !data || data.length === 0) {
    if (error) console.error("Failed to load public services", error.message);
    return DEMO_SERVICES.map((s, idx) => ({
      id: s.id,
      business_id: businessId,
      name_en: s.nameEn,
      name_hu: s.nameHu,
      description_en: s.descriptionEn,
      description_hu: s.descriptionHu,
      price: s.priceEur,
      currency: "EUR",
      duration_minutes: s.durationMinutes,
      is_active: true,
      sort_order: idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  return data;
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

  if (error || !data || data.length === 0) {
    if (error) console.error("Failed to load public portfolio", error.message);
    return DEMO_PORTFOLIO.map((item, idx) => ({
      id: item.id,
      business_id: businessId,
      barber_id: DEMO_BARBERS[idx % DEMO_BARBERS.length].id,
      title_en: item.titleEn,
      title_hu: item.titleHu,
      category: item.category,
      image_path: item.imageUrl,
      is_visible: true,
      sort_order: idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  return data;
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
    const { data, error } = await query
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.error("Failed to load barber working hours", error.message);
      return DEMO_WORKING_HOURS.filter((wh) => !wh.isClosed).map((wh) => ({
        id: `wh-${barberId}-${wh.dayOfWeek}`,
        business_id: businessId,
        barber_id: barberId,
        day_of_week: wh.dayOfWeek,
        start_time: `${wh.startTime}:00`,
        end_time: `${wh.endTime}:00`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }

    return data;
  }

  // Deduplicate at the data/query layer for public business-level display
  // A barbershop is open on a day if at least one active barber has working hours on that day.
  // The business opening span runs from the earliest start_time to the latest end_time.
  const { data, error } = await query
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("Failed to load public working hours", error.message);
    return DEMO_WORKING_HOURS.filter((wh) => !wh.isClosed).map((wh) => ({
      id: `business-wh-${wh.dayOfWeek}`,
      business_id: businessId,
      barber_id: "business",
      day_of_week: wh.dayOfWeek,
      start_time: `${wh.startTime}:00`,
      end_time: `${wh.endTime}:00`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  // Group by day_of_week
  const dayMap = new Map<number, PublicWorkingHours[]>();
  for (const row of data) {
    if (!dayMap.has(row.day_of_week)) {
      dayMap.set(row.day_of_week, []);
    }
    dayMap.get(row.day_of_week)!.push(row);
  }

  const businessHours: PublicWorkingHours[] = [];

  // Iterate over standard days 0 to 6 (Sunday=0, Monday=1, ... Saturday=6)
  for (let day = 0; day <= 6; day++) {
    const rows = dayMap.get(day);
    if (!rows || rows.length === 0) {
      // Day is closed (no active barbers scheduled)
      continue;
    }

    let earliestStart = rows[0].start_time;
    let latestEnd = rows[0].end_time;

    for (const r of rows) {
      if (r.start_time < earliestStart) earliestStart = r.start_time;
      if (r.end_time > latestEnd) latestEnd = r.end_time;
    }

    businessHours.push({
      id: `business-wh-${day}`,
      business_id: businessId,
      barber_id: "business",
      day_of_week: day,
      start_time: earliestStart,
      end_time: latestEnd,
      is_active: true,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
    });
  }

  return businessHours;
}
