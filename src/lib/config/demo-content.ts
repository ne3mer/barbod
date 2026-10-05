/**
 * Centralized Demo Content & Configuration for Barbod Barber Atelier.
 * 
 * All temporary/demo text, images, pricing, services, barbers, reviews,
 * and atelier details are centralized here so the owner can easily update
 * or replace them in one place.
 */

export interface DemoBarber {
  id: string;
  name: string;
  roleEn: string;
  roleHu: string;
  bioEn: string;
  bioHu: string;
  specialtiesEn: string[];
  specialtiesHu: string[];
  photoUrl: string;
  instagramHandle: string;
  instagramUrl: string;
  displayOrder: number;
}

export interface DemoService {
  id: string;
  nameEn: string;
  nameHu: string;
  descriptionEn: string;
  descriptionHu: string;
  category: "Haircut" | "Beard" | "Grooming Packages";
  durationMinutes: number;
  priceEur: number;
  priceHuf: number;
  isPopular?: boolean;
}

export interface DemoPortfolioItem {
  id: string;
  titleEn: string;
  titleHu: string;
  category: "Haircuts" | "Coloring" | "Styling" | "Other";
  styleTagEn: string;
  styleTagHu: string;
  imageUrl: string;
  barberName: string;
}

export interface DemoReview {
  id: string;
  authorName: string;
  origin: string;
  avatarUrl?: string;
  rating: number;
  dateStr: string;
  serviceNameEn: string;
  serviceNameHu: string;
  barberName: string;
  commentEn: string;
  commentHu: string;
  isVerified: boolean;
}

export interface DemoWorkingDay {
  dayOfWeek: number; // 0=Sunday, 1=Monday...
  dayNameEn: string;
  dayNameHu: string;
  startTime: string;
  endTime: string;
  isClosed?: boolean;
}

export const DEMO_BUSINESS = {
  name: "Barbod Barber Atelier",
  slug: "barbod-barber",
  taglineEn: "Luxury Grooming & Bespoke Barbering in Budapest",
  taglineHu: "Luxus Férfi Ápolás és Egyedi Borbélymesterség Budapesten",
  descriptionEn:
    "A sanctuary of refined masculine grooming in Budapest's cultural quarter. We unite classical European barbering heritage with contemporary precision cutting, bespoke beard architecture, and restorative grooming rituals.",
  descriptionHu:
    "A kifinomult férfi ápolás szentélye Budapest kulturális negyedében. A klasszikus európai borbély hagyományokat ötvözzük a modern precíziós hajvágással, egyedi szakállformázással és prémium rituálékkal.",
  address: "Paulay Ede utca 16",
  district: "1061 Budapest, District VI (Terézváros)",
  country: "Hungary",
  landmarkEn: "Near Hungarian State Opera & Andrássy Avenue",
  landmarkHu: "A Magyar Állami Operaház és az Andrássy út közelében",
  transitEn: "M1 Opera station (2 min walk) · M1/M2/M3 Deák Ferenc tér (6 min walk)",
  transitHu: "M1 Opera megálló (2 perc séta) · M1/M2/M3 Deák Ferenc tér (6 perc séta)",
  phone: "+36 1 789 4521",
  email: "concierge@barbodbarber.hu",
  instagramUrl: "https://instagram.com/barbod.barber.hu",
  instagramHandle: "@barbod.barber.hu",
  googleMapsUrl: "https://maps.google.com/?q=Paulay+Ede+utca+16+Budapest",
  rating: 4.95,
  reviewCount: 184,
  currencyCode: "EUR",
  secondaryCurrencyCode: "HUF",
  foundedYear: 2026,
};

export const DEMO_BARBERS: DemoBarber[] = [
  {
    id: "beddf866-bbd5-405d-a69c-d0689b8ad28f", // Preserves Barbod's existing Supabase ID
    name: "Barbod",
    roleEn: "Founder & Master Barber",
    roleHu: "Alapító & Mesterborbély",
    bioEn:
      "Over 12 years of bespoke craft barbering across distinguished European ateliers. Barbod specializes in classical scissor-over-comb architecture, bespoke cranial consultations, and authentic hot towel straight-razor rituals.",
    bioHu:
      "Több mint 12 év kézműves borbély tapasztalat neves európai szalonokban. Barbod a klasszikus ollós technikák, a személyre szabott fejforma-konzultáció és a hagyományos borotválási rituálék mestere.",
    specialtiesEn: ["Master Scissor Cut", "Traditional Razor Shave", "Atelier Signature", "Cranial Consultation"],
    specialtiesHu: ["Mester ollós hajvágás", "Hagyományos borotválás", "Atelier signature rituálé", "Fejforma-tanácsadás"],
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    instagramHandle: "@barbod.master",
    instagramUrl: "https://instagram.com/barbod.barber.hu",
    displayOrder: 0,
  },
  {
    id: "c8e104f2-95b8-4d32-9cb7-6a184ef33810",
    name: "Viktor Kovács",
    roleEn: "Senior Stylist & Fade Specialist",
    roleHu: "Senior Stylist & Fade Specialista",
    bioEn:
      "Trained in London and Budapest, Viktor brings surgical precision to modern skin fades, textured French crops, and contemporary editorial styling tailored to each client's lifestyle.",
    bioHu:
      "Londonban és Budapesten képzett fodrász-borbély. Viktor sebészi pontosságot visz a modern skin fade átmenetekbe, texturált formákba és a modern férfi frizurákba.",
    specialtiesEn: ["Skin Fade", "Textured Crop", "Low & Mid Tapers", "Modern Styling"],
    specialtiesHu: ["Skin Fade", "Texturált crop", "Taper átmenetek", "Modern styling"],
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    instagramHandle: "@viktor.cuts.bp",
    instagramUrl: "https://instagram.com/barbod.barber.hu",
    displayOrder: 1,
  },
  {
    id: "d9f21503-a6c9-4e43-8dc8-7b295ef44921",
    name: "Attila Nagy",
    roleEn: "Beard Artisan & Shave Craftsman",
    roleHu: "Szakállspecialista & Borotvamester",
    bioEn:
      "A dedicated scholar of traditional facial hair architecture and hot towel conditioning. Attila sculpts razor-sharp beard contours and restorative steam treatments designed for the discerning gentleman.",
    bioHu:
      "A hagyományos szakáll-architektúra és a gőzölős kondicionálás elhivatott mestere. Attila éles, precíz szakállvonalakat és pihentető forró törölközős kezeléseket készít.",
    specialtiesEn: ["Beard Sculpting", "Hot Towel Shave", "Beard Fade", "Botanical Conditioning"],
    specialtiesHu: ["Szakállformázás", "Forró törölközős borotválás", "Szakáll fade", "Növényi olajos kondicionálás"],
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    instagramHandle: "@attila.beardcraft",
    instagramUrl: "https://instagram.com/barbod.barber.hu",
    displayOrder: 2,
  },
];

export const DEMO_SERVICES: DemoService[] = [
  // --- HAIRCUT ---
  {
    id: "3fcf167a-cc97-402b-a498-71f13c828b51", // Replaces test service in DB
    nameEn: "Classic Tailored Haircut",
    nameHu: "Klasszikus Személyre Szabott Hajvágás",
    descriptionEn:
      "Comprehensive cranial consultation, precision scissor-and-clipper styling, invigorating botanical scalp wash, hot neck lather razor cleanup, and bespoke styling finish.",
    descriptionHu:
      "Részletes fejforma-konzultáció, precíziós ollós és gépi vágás, frissítő hajmosás, meleg habos nyakborotválás és prémium finish termékek.",
    category: "Haircut",
    durationMinutes: 45,
    priceEur: 35,
    priceHuf: 14000,
    isPopular: true,
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c81",
    nameEn: "Precision Skin Fade",
    nameHu: "Precíziós Skin Fade",
    descriptionEn:
      "Seamless zero-gap transition blended to skin with foil shaver perfection, scissor-sculpted top, razor edge detailing, wash, and matte clay finish.",
    descriptionHu:
      "Fokozatmentes átmenet a nullától fóliás borotválással, ollóval megmunkált tetőhossz, éles kontúrok, hajmosás és matt waxos beállítás.",
    category: "Haircut",
    durationMinutes: 45,
    priceEur: 38,
    priceHuf: 15000,
    isPopular: true,
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c82",
    nameEn: "Master Scissor Cut & Styling",
    nameHu: "Mester Ollós Hajvágás & Styling",
    descriptionEn:
      "100% handcrafted scissor-over-comb architecture for medium and long profiles. Includes texture balancing, deep conditioning scalp massage, and natural flow blowout.",
    descriptionHu:
      "100%-ban kézi ollós hajvágás közép- és hosszú hajra. Textúrázás, mélykondicionáló fejbőrmasszázs és természetes szárítás.",
    category: "Haircut",
    durationMinutes: 60,
    priceEur: 42,
    priceHuf: 16500,
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c83",
    nameEn: "Long Hair Restyle & Conditioning",
    nameHu: "Hosszú Haj Formázás & Ápolás",
    descriptionEn:
      "Tailored for shoulder-length or longer hair. Split-end elimination, layering, keratin restoration treatment, scalp therapy, and editorial blowout styling.",
    descriptionHu:
      "Vállig vagy tovább érő hajhoz. Hajvégek frissítése, rétegzés, keratinos ápoló pakolás, fejbőrterápia és szárítás.",
    category: "Haircut",
    durationMinutes: 60,
    priceEur: 45,
    priceHuf: 17500,
  },

  // --- BEARD ---
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c84",
    nameEn: "Beard Sculpt & Botanical Oil",
    nameHu: "Szakállformázás & Növényi Olajos Ápolás",
    descriptionEn:
      "Freehand clipper sculpt, mustache detailing, stray trimming, warm towel compression, and organic cold-pressed beard serum application.",
    descriptionHu:
      "Szabadkézi gépi és ollós szakállformázás, bajuszigazítás, meleg törölközős puhítás és hidegen sajtolt prémium szakállolaj.",
    category: "Beard",
    durationMinutes: 30,
    priceEur: 22,
    priceHuf: 8500,
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c85",
    nameEn: "Beard Shape & Sharp Razor Line-Up",
    nameHu: "Szakállkontúr & Éles Penge Kontúrozás",
    descriptionEn:
      "Full beard restructuring with razor-sharp cheek and throat perimeter definition using warm shaving cream and straight razor precision, followed by soothing aftershave balm.",
    descriptionHu:
      "Teljes szakállforma átalakítás éles orca- és nyakkontúrokkal, meleg habos egyenes pengés borotválással és hűsítő aftershave balzsammal.",
    category: "Beard",
    durationMinutes: 35,
    priceEur: 26,
    priceHuf: 10000,
    isPopular: true,
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c86",
    nameEn: "Hot Towel Luxury Beard Ritual",
    nameHu: "Forró Törölközős Luxus Szakállrituálé",
    descriptionEn:
      "Triple eucalyptus steamed hot towel compressions, pre-shave oil massage, precision razor shaping, nourishing butter mask, and beard brush blowout.",
    descriptionHu:
      "Háromszoros eukaliptuszos forró törölközős gőzölés, borotválkozás előtti olajos masszázs, pengés kontúrozás, tápláló szakállvaj pakolás.",
    category: "Beard",
    durationMinutes: 45,
    priceEur: 32,
    priceHuf: 12500,
  },

  // --- GROOMING PACKAGES ---
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c87",
    nameEn: "The Atelier Signature (Cut + Beard)",
    nameHu: "Az Atelier Signature (Haj + Szakáll)",
    descriptionEn:
      "Our most requested combination. Complete tailored haircut or skin fade, accompanied by full razor-sculpted beard grooming, double hot towel wash, and complimentary espresso.",
    descriptionHu:
      "A legnépszerűbb kombinációnk. Személyre szabott hajvágás vagy fade, teljes borotvával kontúrozott szakállápolással, dupla forró törölközővel és eszpresszóval.",
    category: "Grooming Packages",
    durationMinutes: 75,
    priceEur: 55,
    priceHuf: 21500,
    isPopular: true,
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c88",
    nameEn: "Traditional Hot Towel Straight Razor Shave",
    nameHu: "Hagyományos Forró Törölközős Pengés Borotválás",
    descriptionEn:
      "The quintessential barbering craft: steamed eucalyptus towels, badger brush lather, two-pass straight razor shave, ice towel pore close, and bay rum splash.",
    descriptionHu:
      "A klasszikus borbély élmény: eukaliptuszos forró törölközők, borzszőr pamaccsal vert meleg hab, kétkörös precíz pengés borotválás és jeges póruszárás.",
    category: "Grooming Packages",
    durationMinutes: 45,
    priceEur: 35,
    priceHuf: 13500,
  },
  {
    id: "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c89",
    nameEn: "The Royal Atelier Grooming Experience",
    nameHu: "A Királyi Atelier Grooming Élmény",
    descriptionEn:
      "The definitive executive retreat: Tailored haircut, hot towel straight razor shave or luxury beard sculpt, exfoliating scalp treatment, ear/nose grooming, and single-origin espresso or whiskey.",
    descriptionHu:
      "A legmagasabb szintű feltöltődés: Egyedi hajvágás, forró törölközős borotválás vagy szakállápolás, mélytisztító fejbőrkezelés, aprólékos fül/orr szőrtelenítés és minőségi ital.",
    category: "Grooming Packages",
    durationMinutes: 90,
    priceEur: 75,
    priceHuf: 29500,
  },
];

export const DEMO_PORTFOLIO: DemoPortfolioItem[] = [
  {
    id: "port-1",
    titleEn: "Seamless Skin Fade with Textured Crop",
    titleHu: "Fokozatmentes Skin Fade Texturált Felsőrésszel",
    category: "Haircuts",
    styleTagEn: "Skin Fade",
    styleTagHu: "Skin Fade",
    imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?auto=format&fit=crop&w=1200&q=80",
    barberName: "Viktor Kovács",
  },
  {
    id: "port-2",
    titleEn: "Classic Scissor Architecture & Natural Taper",
    titleHu: "Klasszikus Ollós Vágás Természetes Nyakkontúrral",
    category: "Haircuts",
    styleTagEn: "Classic Scissor Cut",
    styleTagHu: "Klasszikus Ollós",
    imageUrl: "https://images.unsplash.com/photo-1504703395950-b89145a5425b?auto=format&fit=crop&w=1200&q=80",
    barberName: "Barbod",
  },
  {
    id: "port-3",
    titleEn: "Sculpted Full Beard with Razor Line-Up",
    titleHu: "Formázott Dús Szakáll Éles Pengés Kontúrral",
    category: "Other",
    styleTagEn: "Beard Fade",
    styleTagHu: "Szakáll Fade",
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80",
    barberName: "Attila Nagy",
  },
  {
    id: "port-4",
    titleEn: "Executive Slick Back with Mid Drop Fade",
    titleHu: "Elegáns Hátrafésült Frizura Mid Drop Fade-del",
    category: "Haircuts",
    styleTagEn: "Slick Back",
    styleTagHu: "Slick Back",
    imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80",
    barberName: "Barbod",
  },
  {
    id: "port-5",
    titleEn: "Traditional Straight Razor Shave & Hot Towel",
    titleHu: "Hagyományos Egyenes Pengés Borotválás & Meleg Törölköző",
    category: "Other",
    styleTagEn: "Hot Towel Shave",
    styleTagHu: "Forró Törölközős Borotválás",
    imageUrl: "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=1200&q=80",
    barberName: "Attila Nagy",
  },
  {
    id: "port-6",
    titleEn: "Precision Scissor Taper & Volume Quiff",
    titleHu: "Precíziós Ollós Átmenet és Dús Quiff Frizura",
    category: "Haircuts",
    styleTagEn: "Mid Fade",
    styleTagHu: "Mid Fade",
    imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
    barberName: "Viktor Kovács",
  },
  {
    id: "port-7",
    titleEn: "Precision Razor Beard Contouring & Moustache",
    titleHu: "Precíziós Szakállvonal és Formázott Bajusz",
    category: "Other",
    styleTagEn: "Beard Trim",
    styleTagHu: "Szakálligazítás",
    imageUrl: "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=1200&q=80",
    barberName: "Attila Nagy",
  },
  {
    id: "port-8",
    titleEn: "Long Hair Texture Shaping & Natural Flow",
    titleHu: "Hosszú Férfi Haj Rétegezés & Természetes Esés",
    category: "Styling",
    styleTagEn: "Long Hair",
    styleTagHu: "Hosszú Haj",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1200&q=80",
    barberName: "Barbod",
  },
  {
    id: "port-9",
    titleEn: "Sharp Low Fade with Textured Top",
    titleHu: "Hangsúlyos Low Fade Texturált Tetővel",
    category: "Haircuts",
    styleTagEn: "Low Fade",
    styleTagHu: "Low Fade",
    imageUrl: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=1200&q=80",
    barberName: "Viktor Kovács",
  },
  {
    id: "port-10",
    titleEn: "Modern Voluminous Pompadour & Clean Temples",
    titleHu: "Modern Dús Pompadour & Tiszta Halánték",
    category: "Haircuts",
    styleTagEn: "Classic Scissor Cut",
    styleTagHu: "Klasszikus Ollós",
    imageUrl: "https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=1200&q=80",
    barberName: "Viktor Kovács",
  },
  {
    id: "port-11",
    titleEn: "Military Precision Buzz Cut & Razor Line",
    titleHu: "Katonás Precíziós Buzz Cut & Kontúrozás",
    category: "Haircuts",
    styleTagEn: "Buzz Cut",
    styleTagHu: "Buzz Cut",
    imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=80",
    barberName: "Viktor Kovács",
  },
  {
    id: "port-12",
    titleEn: "Straight Razor Detailing & Hot Towel Treatment",
    titleHu: "Borotvás Kidolgozás & Forró Gőzös Kezelés",
    category: "Other",
    styleTagEn: "Beard Treatment",
    styleTagHu: "Szakállkezelés",
    imageUrl: "https://images.unsplash.com/photo-1593702295094-aea22597af65?auto=format&fit=crop&w=1200&q=80",
    barberName: "Attila Nagy",
  },
];

export const DEMO_REVIEWS: DemoReview[] = [
  {
    id: "rev-1",
    authorName: "Márk Varga",
    origin: "Budapest · District V",
    rating: 5,
    dateStr: "Yesterday",
    serviceNameEn: "The Atelier Signature",
    serviceNameHu: "Az Atelier Signature",
    barberName: "Barbod",
    commentEn:
      "Barbod's attention to detail is truly unmatched in Budapest. The skin fade was surgical and the atmosphere with the single-origin espresso felt like a private club. Worth every forint.",
    commentHu:
      "Barbod precizitása páratlan Budapesten. Az átmenet sebészi pontosságú volt, a friss eszpresszó és a zene pedig olyan hangulatot teremtett, mintha egy privát klubban lennék.",
    isVerified: true,
  },
  {
    id: "rev-2",
    authorName: "Julian Schneider",
    origin: "Vienna, Austria",
    rating: 5,
    dateStr: "3 days ago",
    serviceNameEn: "Master Scissor Cut",
    serviceNameHu: "Mester Ollós Hajvágás",
    barberName: "Viktor Kovács",
    commentEn:
      "I travel from Vienna to Budapest monthly for meetings. Viktor gave me arguably the best scissor cut I've had in Central Europe. The hot towel finish made my entire afternoon.",
    commentHu:
      "Havi szinten utazom Bécsből Budapestre tárgyalásokra. Viktor vágta a legjobb ollós frizurát, amit valaha Közép-Európában kaptam. A forró törölközős lezárás csodás volt.",
    isVerified: true,
  },
  {
    id: "rev-3",
    authorName: "Bence Kovács",
    origin: "Budapest · District VI",
    rating: 5,
    dateStr: "1 week ago",
    serviceNameEn: "Hot Towel Luxury Beard Ritual",
    serviceNameHu: "Forró Törölközős Luxus Szakállrituálé",
    barberName: "Attila Nagy",
    commentEn:
      "Attila completely transformed my beard shape. Took his time with the steamed eucalyptus towels and straight razor lines. Truly a grooming atelier, not an assembly-line barbershop.",
    commentHu:
      "Attila teljesen újjávarázsolta a szakállamat. Nem kapkodott, a forró eukaliptuszos törölközők és a penge precizitása lenyűgöző. Valódi műhely, nem futószalag.",
    isVerified: true,
  },
  {
    id: "rev-4",
    authorName: "David Miller",
    origin: "London, UK",
    rating: 5,
    dateStr: "2 weeks ago",
    serviceNameEn: "Precision Skin Fade",
    serviceNameHu: "Precíziós Skin Fade",
    barberName: "Viktor Kovács",
    commentEn:
      "Booked online before flying into Budapest for the weekend. Flawless booking system with instant confirmation, zero waiting time, and Viktor delivered a razor-sharp mid fade. Stunning interior too.",
    commentHu:
      "Online foglaltam még a londoni indulás előtt. Hibátlan rendszer, zéró várakozás a helyszínen, és Viktor tűpontos fade-et készített. Gyönyörű az enteriőr is.",
    isVerified: true,
  },
  {
    id: "rev-5",
    authorName: "Tamás Balogh",
    origin: "Budapest · District II",
    rating: 5,
    dateStr: "2 weeks ago",
    serviceNameEn: "The Royal Atelier Experience",
    serviceNameHu: "A Királyi Atelier Grooming Élmény",
    barberName: "Barbod",
    commentEn:
      "The Royal Experience is 90 minutes of pure therapeutic relaxation. Premium botanical products, great conversation without being intrusive, and an immaculate haircut that lasts weeks.",
    commentHu:
      "A Királyi élmény 90 perc tiszta kikapcsolódás. Prémium növényi termékek, kellemes beszélgetés tolakodás nélkül, és egy olyan precíz vágás, ami hetekig tartja a formáját.",
    isVerified: true,
  },
  {
    id: "rev-6",
    authorName: "Gábor Németh",
    origin: "Budapest · District VII",
    rating: 5,
    dateStr: "3 weeks ago",
    serviceNameEn: "Classic Tailored Haircut",
    serviceNameHu: "Klasszikus Személyre Szabott Hajvágás",
    barberName: "Barbod",
    commentEn:
      "Hands down the best barbershop on the Pest side. Impeccable cleanliness, luxury aesthetics with vintage leather Belmont chairs, and masters of their craft.",
    commentHu:
      "Kétségkívül a legjobb borbélyüzlet a pesti oldalon. Kifogástalan tisztaság, klasszikus Belmont bőr székek, prémium hangulat és igazi mesterek.",
    isVerified: true,
  },
];

export const DEMO_WORKING_HOURS: DemoWorkingDay[] = [
  { dayOfWeek: 1, dayNameEn: "Monday", dayNameHu: "Hétfő", startTime: "09:00", endTime: "20:00" },
  { dayOfWeek: 2, dayNameEn: "Tuesday", dayNameHu: "Kedd", startTime: "09:00", endTime: "20:00" },
  { dayOfWeek: 3, dayNameEn: "Wednesday", dayNameHu: "Szerda", startTime: "09:00", endTime: "20:00" },
  { dayOfWeek: 4, dayNameEn: "Thursday", dayNameHu: "Csütörtök", startTime: "09:00", endTime: "20:00" },
  { dayOfWeek: 5, dayNameEn: "Friday", dayNameHu: "Péntek", startTime: "09:00", endTime: "20:00" },
  { dayOfWeek: 6, dayNameEn: "Saturday", dayNameHu: "Szombat", startTime: "10:00", endTime: "18:00" },
  { dayOfWeek: 0, dayNameEn: "Sunday", dayNameHu: "Vasárnap", startTime: "10:00", endTime: "16:00" },
];

export const DEMO_ATELIER_EXPERIENCE = [
  {
    titleEn: "Bespoke Cranial Consultation",
    titleHu: "Egyéni Fejforma-Konzultáció",
    descEn: "We study bone structure, hair growth direction, and personal routine before touching shears.",
    descHu: "Mielőtt az ollóhoz nyúlnánk, felmérjük a fejformát, a haj forgóit és a mindennapi szokásokat.",
  },
  {
    titleEn: "Traditional Straight-Razor Rituals",
    titleHu: "Hagyományos Pengés Rituálék",
    descEn: "Steamed eucalyptus towels, badger bristle lather, and surgical straight-razor contouring.",
    descHu: "Gőzölt eukaliptuszos törölközők, pamacsos meleg hab és borotvaéles kontúrozás.",
  },
  {
    titleEn: "Complimentary Atelier Bar",
    titleHu: "Díjmentes Kávé & Italok",
    descEn: "Fresh single-origin espresso, mineral water, or Japanese craft whiskey with every visit.",
    descHu: "Frissen őrölt prémium eszpresszó, ásványvíz vagy minőségi japán whiskey minden vendégünknek.",
  },
  {
    titleEn: "Vintage Belmont Comfort",
    titleHu: "Eredeti Belmont Bőrfotelek",
    descEn: "Restored vintage Japanese leather barber chairs engineered for optimum ergonomic relaxation.",
    descHu: "Felújított klasszikus japán bőr borbélyfotelek a maximális kényelem és ellazulás érdekében.",
  },
];
