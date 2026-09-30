import {
  getPublicBusiness,
  getPublicServices,
  getPublicPortfolio,
  getPublicWorkingHours,
} from "@/lib/public/business";
import { PublicHome } from "@/components/public/public-home";

export const metadata = {
  title: "Barbod Barber | Premium Barbershop Budapest",
  description:
    "Precision cuts, traditional beard grooming, and craft barbering in Budapest, Hungary. Book your appointment online.",
  openGraph: {
    title: "Barbod Barber | Budapest",
    description:
      "Precision cuts, traditional beard grooming, and craft barbering in Budapest, Hungary.",
    type: "website",
  },
};

export default async function HomePage() {
  const business = await getPublicBusiness("barbod-barber");

  if (!business) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-bold">Barbod Barber</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Barbershop business is currently being configured.
        </p>
      </div>
    );
  }

  const [services, portfolio, workingHours] = await Promise.all([
    getPublicServices(business.id),
    getPublicPortfolio(business.id),
    getPublicWorkingHours(business.id),
  ]);

  return (
    <PublicHome
      business={business}
      services={services}
      portfolio={portfolio}
      workingHours={workingHours}
    />
  );
}
