export type Language = "en" | "hu";

export const translations = {
  en: {
    // Navigation & Header
    brand: "Barbod Barber",
    navServices: "Services",
    navPortfolio: "Portfolio",
    navAbout: "About",
    navHours: "Hours & Location",
    bookNow: "Book Appointment",

    // Hero
    heroTagline: "PREMIUM BARBERSHOP IN BUDAPEST",
    heroTitle: "Precision Cuts & Craft Barbering",
    heroSubtitle:
      "Experience traditional craftsmanship combined with modern styling. Located in the heart of Budapest.",
    heroPrimaryCta: "Book an Appointment",
    heroSecondaryCta: "View Services",

    // Services Section
    servicesTitle: "Services & Pricing",
    servicesSubtitle:
      "Every haircut and grooming service includes consultation, wash, and premium styling.",
    duration: "mins",
    bookService: "Book This Service",

    // Portfolio Section
    portfolioTitle: "Portfolio Showcase",
    portfolioSubtitle: "Explore our recent haircuts, fades, and beard styling.",
    allCategories: "All Works",

    // About Section
    aboutTitle: "The Craft",
    aboutText:
      "Barbod Barber is dedicated to delivering sharp, clean, and tailored cuts for every client. We take pride in attention to detail, traditional technique, and modern aesthetic precision.",

    // Hours & Location Section
    hoursTitle: "Opening Hours",
    locationTitle: "Location & Contact",
    closed: "Closed",
    address: "Address",
    phone: "Phone",
    email: "Email",
    instagram: "Instagram",

    // Booking Flow
    bookingTitle: "Book Your Appointment",
    step1Title: "1. Select Service",
    step2Title: "2. Choose Date",
    step3Title: "3. Choose Time Slot",
    step4Title: "4. Your Information",
    step5Title: "5. Review & Confirm",
    stepSuccessTitle: "Booking Confirmed",

    nextStep: "Continue",
    prevStep: "Back",
    confirmBooking: "Confirm Booking",
    submittingBooking: "Reserving Slot...",

    selectDatePrompt: "Select a date to view available time slots",
    noSlotsAvailable:
      "No available time slots for this date. Please choose another day.",
    loadingSlots: "Calculating available slots...",

    // Form Labels
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. Alex Kovács",
    phoneNumber: "Phone Number",
    phonePlaceholder: "+36 30 123 4567",
    emailAddress: "Email Address (Optional)",
    emailPlaceholder: "alex@example.com",
    notesLabel: "Notes / Special Requests (Optional)",
    notesPlaceholder: "e.g. Preferred style or notes for the barber...",

    // Success Screen
    successHeadline: "Appointment Request Received",
    successMessage:
      "Thank you! Your appointment has been recorded in our system as pending confirmation.",
    bookingDetails: "Booking Summary",
    statusBadgePending: "Pending Confirmation",
    backToHome: "Return to Homepage",
    bookAnother: "Book Another Appointment",

    // Errors
    errorRequiredFields: "Please fill out all required fields.",
    errorConflict: "This time slot is no longer available. Please choose another time.",
    errorGeneric: "An error occurred while creating your booking. Please try again.",
  },

  hu: {
    // Navigation & Header
    brand: "Barbod Barber",
    navServices: "Szolgáltatások",
    navPortfolio: "Portfólió",
    navAbout: "Rólunk",
    navHours: "Nyitvatartás & Kapcsolat",
    bookNow: "Időpontfoglalás",

    // Hero
    heroTagline: "PREMIUM BORBÉLYÜZLET BUDAPESTEN",
    heroTitle: "Precíziós Hajvágás & Borbély Kézművesség",
    heroSubtitle:
      "Tapasztalja meg a hagyományos mesterséget modern stílussal ötvözve. Budapest szívében.",
    heroPrimaryCta: "Időpont foglalása",
    heroSecondaryCta: "Szolgáltatások megtekintése",

    // Services Section
    servicesTitle: "Szolgáltatások & Árak",
    servicesSubtitle:
      "Minden hajvágás és ápolási szolgáltatás tartalmazza a konzultációt, hajmosást és prémium formázást.",
    duration: "perc",
    bookService: "Szolgáltatás kiválasztása",

    // Portfolio Section
    portfolioTitle: "Portfólió Galéria",
    portfolioSubtitle: "Böngésszen legutóbbi hajvágásaink, átmeneteink és szakállformázásaink között.",
    allCategories: "Összes munkánk",

    // About Section
    aboutTitle: "A Mesterség",
    aboutText:
      "A Barbod Barber célja, hogy éles, tiszta és személyre szabott vágásokat nyújtson minden vendégnek. Bízunk a részletekre való odafigyelésben és a precizitásban.",

    // Hours & Location Section
    hoursTitle: "Nyitvatartás",
    locationTitle: "Helyszín & Kapcsolat",
    closed: "Zárva",
    address: "Cím",
    phone: "Telefon",
    email: "E-mail",
    instagram: "Instagram",

    // Booking Flow
    bookingTitle: "Időpontfoglalás",
    step1Title: "1. Szolgáltatás kiválasztása",
    step2Title: "2. Dátum kiválasztása",
    step3Title: "3. Időpont kiválasztása",
    step4Title: "4. Az Ön adatai",
    step5Title: "5. Áttekintés & Megerősítés",
    stepSuccessTitle: "Foglalás Megerősítve",

    nextStep: "Tovább",
    prevStep: "Vissza",
    confirmBooking: "Foglalás megerősítése",
    submittingBooking: "Foglalás feldolgozása...",

    selectDatePrompt: "Válasszon dátumot a szabad időpontok megtekintéséhez",
    noSlotsAvailable:
      "Ezen a napon nincsenek szabad időpontok. Kérjük, válasszon másik napot.",
    loadingSlots: "Szabad időpontok kiszámítása...",

    // Form Labels
    fullName: "Teljes Név",
    fullNamePlaceholder: "pl. Kovács Alex",
    phoneNumber: "Telefonszám",
    phonePlaceholder: "+36 30 123 4567",
    emailAddress: "E-mail cím (Opcionális)",
    emailPlaceholder: "alex@example.com",
    notesLabel: "Megjegyzés / Kérés (Opcionális)",
    notesPlaceholder: "pl. Kívánt frizura stílus...",

    // Success Screen
    successHeadline: "Foglalási Igény Rögzítve",
    successMessage:
      "Köszönjük! Időpontfoglalási igényét rögzítettük rendszerünkben.",
    bookingDetails: "Foglalás Részletei",
    statusBadgePending: "Függőben lévő visszaigazolás",
    backToHome: "Vissza a főoldalra",
    bookAnother: "Új időpont foglalása",

    // Errors
    errorRequiredFields: "Kérjük, töltse ki az összes kötelező mezőt.",
    errorConflict: "Ez az időpont már nem elérhető. Kérjük, válasszon másik időpontot.",
    errorGeneric: "Hiba történt a foglalás során. Kérjük, próbálja újra.",
  },
} as const;

export type TranslationKeys = {
  [K in keyof typeof translations.en]: string;
};

export function getLocalizedField(
  obj: Record<string, unknown>,
  fieldBase: string,
  lang: Language
): string {
  const primaryKey = `${fieldBase}_${lang}`;
  const fallbackKey = fieldBase === "name" || fieldBase === "description" ? `${fieldBase}_en` : fieldBase;
  const val = obj[primaryKey] || obj[fallbackKey];
  return typeof val === "string" ? val : "";
}
