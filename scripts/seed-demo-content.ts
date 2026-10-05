import { createAdminClient } from "../src/lib/supabase/admin";
import {
  DEMO_BUSINESS,
  DEMO_BARBERS,
  DEMO_SERVICES,
  DEMO_PORTFOLIO,
  DEMO_WORKING_HOURS,
} from "../src/lib/config/demo-content";

async function seed() {
  console.log("Starting Barbod Barber Demo Content Seeding...");
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("Supabase Admin client not configured.");
    process.exit(1);
  }

  // 1. Get or Update Business
  let { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", "barbod-barber")
    .maybeSingle();

  if (!business) {
    console.log("No business with slug barbod-barber found. Fetching first business...");
    const { data: firstBiz } = await supabase.from("businesses").select("*").limit(1).maybeSingle();
    business = firstBiz;
  }

  if (!business) {
    console.error("No business found in database to update.");
    process.exit(1);
  }

  console.log(`Updating business: ${business.id} (${business.name})`);

  const { error: bizErr } = await supabase
    .from("businesses")
    .update({
      name: DEMO_BUSINESS.name,
      description_en: DEMO_BUSINESS.descriptionEn,
      description_hu: DEMO_BUSINESS.descriptionHu,
      phone: DEMO_BUSINESS.phone,
      email: DEMO_BUSINESS.email,
      address: `${DEMO_BUSINESS.address}, ${DEMO_BUSINESS.district}`,
      instagram_url: DEMO_BUSINESS.instagramUrl,
    })
    .eq("id", business.id);

  if (bizErr) {
    console.error("Failed to update business:", bizErr.message);
  } else {
    console.log("✓ Business updated with Budapest atelier details.");
  }

  // 2. Barbers
  console.log("\nSeeding Barbers...");
  // First, check if Barbod exists
  const { data: existingBarbers } = await supabase
    .from("barbers")
    .select("*")
    .eq("business_id", business.id);

  const barberIdMap: Record<string, string> = {};

  for (const demoBarber of DEMO_BARBERS) {
    const existing = existingBarbers?.find(
      (b) => b.id === demoBarber.id || b.name.toLowerCase() === demoBarber.name.toLowerCase()
    );

    if (existing) {
      console.log(`Updating existing barber: ${existing.name}`);
      const { error: upErr } = await supabase
        .from("barbers")
        .update({
          name: demoBarber.name,
          profile_photo_url: demoBarber.photoUrl,
          bio_en: demoBarber.bioEn,
          bio_hu: demoBarber.bioHu,
          is_active: true,
          display_order: demoBarber.displayOrder,
        })
        .eq("id", existing.id);

      if (upErr) console.error("Error updating barber:", upErr.message);
      barberIdMap[demoBarber.name] = existing.id;
    } else {
      console.log(`Inserting new barber: ${demoBarber.name}`);
      const { data: newB, error: insErr } = await supabase
        .from("barbers")
        .insert({
          id: demoBarber.id,
          business_id: business.id,
          name: demoBarber.name,
          profile_photo_url: demoBarber.photoUrl,
          bio_en: demoBarber.bioEn,
          bio_hu: demoBarber.bioHu,
          is_active: true,
          display_order: demoBarber.displayOrder,
        })
        .select()
        .single();

      if (insErr) {
        // Try without explicit ID if UUID error
        console.warn("Retrying insert without explicit ID...", insErr.message);
        const { data: retryB, error: retryErr } = await supabase
          .from("barbers")
          .insert({
            business_id: business.id,
            name: demoBarber.name,
            profile_photo_url: demoBarber.photoUrl,
            bio_en: demoBarber.bioEn,
            bio_hu: demoBarber.bioHu,
            is_active: true,
            display_order: demoBarber.displayOrder,
          })
          .select()
          .single();

        if (retryErr) console.error("Error inserting barber:", retryErr.message);
        if (retryB) barberIdMap[demoBarber.name] = retryB.id;
      } else if (newB) {
        barberIdMap[demoBarber.name] = newB.id;
      }
    }
  }

  // 3. Services
  console.log("\nSeeding Services...");
  const { data: existingServices } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id);

  const serviceIdMap: Record<string, string> = {};

  for (const demoSvc of DEMO_SERVICES) {
    const existing = existingServices?.find(
      (s) => s.id === demoSvc.id || s.name_en.toLowerCase() === demoSvc.nameEn.toLowerCase()
    );

    if (existing) {
      console.log(`Updating service: ${demoSvc.nameEn}`);
      const { error: upErr } = await supabase
        .from("services")
        .update({
          name_en: demoSvc.nameEn,
          name_hu: demoSvc.nameHu,
          description_en: demoSvc.descriptionEn,
          description_hu: demoSvc.descriptionHu,
          price: demoSvc.priceEur,
          currency: "EUR",
          duration_minutes: demoSvc.durationMinutes,
          is_active: true,
        })
        .eq("id", existing.id);

      if (upErr) console.error("Error updating service:", upErr.message);
      serviceIdMap[demoSvc.nameEn] = existing.id;
    } else {
      console.log(`Inserting service: ${demoSvc.nameEn}`);
      const { data: newS, error: insErr } = await supabase
        .from("services")
        .insert({
          id: demoSvc.id,
          business_id: business.id,
          name_en: demoSvc.nameEn,
          name_hu: demoSvc.nameHu,
          description_en: demoSvc.descriptionEn,
          description_hu: demoSvc.descriptionHu,
          price: demoSvc.priceEur,
          currency: "EUR",
          duration_minutes: demoSvc.durationMinutes,
          is_active: true,
          sort_order: DEMO_SERVICES.indexOf(demoSvc),
        })
        .select()
        .single();

      if (insErr) {
        console.warn("Retrying service insert without ID...", insErr.message);
        const { data: retryS, error: retryErr } = await supabase
          .from("services")
          .insert({
            business_id: business.id,
            name_en: demoSvc.nameEn,
            name_hu: demoSvc.nameHu,
            description_en: demoSvc.descriptionEn,
            description_hu: demoSvc.descriptionHu,
            price: demoSvc.priceEur,
            currency: "EUR",
            duration_minutes: demoSvc.durationMinutes,
            is_active: true,
            sort_order: DEMO_SERVICES.indexOf(demoSvc),
          })
          .select()
          .single();

        if (retryErr) console.error("Error inserting service:", retryErr.message);
        if (retryS) serviceIdMap[demoSvc.nameEn] = retryS.id;
      } else if (newS) {
        serviceIdMap[demoSvc.nameEn] = newS.id;
      }
    }
  }

  // 4. Barber Services Mapping
  console.log("\nUpdating Barber-Service Assignments...");
  const allBarberIds = Object.values(barberIdMap);
  const allServiceIds = Object.values(serviceIdMap);

  for (const bId of allBarberIds) {
    for (const sId of allServiceIds) {
      await supabase
        .from("barber_services")
        .upsert({ barber_id: bId, service_id: sId }, { onConflict: "barber_id,service_id" });
    }
  }
  console.log("✓ All barbers assigned to all services.");

  // 5. Working Hours
  console.log("\nConfiguring Working Hours for all barbers...");
  for (const bId of allBarberIds) {
    for (const wh of DEMO_WORKING_HOURS) {
      const { data: existingWh } = await supabase
        .from("working_hours")
        .select("id")
        .eq("business_id", business.id)
        .eq("barber_id", bId)
        .eq("day_of_week", wh.dayOfWeek)
        .maybeSingle();

      if (existingWh) {
        await supabase
          .from("working_hours")
          .update({
            start_time: `${wh.startTime}:00`,
            end_time: `${wh.endTime}:00`,
            is_active: true,
          })
          .eq("id", existingWh.id);
      } else {
        await supabase.from("working_hours").insert({
          business_id: business.id,
          barber_id: bId,
          day_of_week: wh.dayOfWeek,
          start_time: `${wh.startTime}:00`,
          end_time: `${wh.endTime}:00`,
          is_active: true,
        });
      }
    }
  }
  console.log("✓ Working hours configured (Mon-Sun) for all 3 barbers.");

  // 6. Portfolio Items
  console.log("\nSeeding Portfolio Items...");
  for (const item of DEMO_PORTFOLIO) {
    const assignedBarberId = barberIdMap[item.barberName] || allBarberIds[0];
    const { data: existingPort } = await supabase
      .from("portfolio_items")
      .select("id")
      .eq("business_id", business.id)
      .eq("title_en", item.titleEn)
      .maybeSingle();

    if (!existingPort) {
      await supabase.from("portfolio_items").insert({
        business_id: business.id,
        barber_id: assignedBarberId,
        title_en: item.titleEn,
        title_hu: item.titleHu,
        category: item.category,
        image_path: item.imageUrl, // Stores full URL or path
        is_visible: true,
        sort_order: DEMO_PORTFOLIO.indexOf(item),
      });
    } else {
      await supabase
        .from("portfolio_items")
        .update({
          barber_id: assignedBarberId,
          title_hu: item.titleHu,
          category: item.category,
          image_path: item.imageUrl,
          is_visible: true,
          sort_order: DEMO_PORTFOLIO.indexOf(item),
        })
        .eq("id", existingPort.id);
    }
  }
  console.log("✓ Portfolio items seeded.");

  console.log("\n🎉 Demo Content Seeding Complete!");
}

seed().catch(console.error);
