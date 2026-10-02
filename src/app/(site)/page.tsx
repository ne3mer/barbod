import {
  getPublicBusiness,
  getPublicServices,
  getPublicPortfolio,
  getPublicWorkingHours,
  getPublicBarbers,
} from "@/lib/public/business";
import { fetchInstagramFeed } from "@/lib/instagram/client";
import { PublicHome } from "@/components/public/public-home";

export const metadata = {
  title: "Barbod Barber | Premium Multi-Staff Barbershop Budapest",
  description:
    "Precision cuts, traditional beard grooming, and craft barbering in Budapest, Hungary. Book with your preferred barber online.",
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

  const [barbers, services, portfolio, workingHours, instagramFeed] = await Promise.all([
    getPublicBarbers(business.id),
    getPublicServices(business.id),
    getPublicPortfolio(business.id),
    getPublicWorkingHours(business.id),
    fetchInstagramFeed(),
  ]);

  return (
    <PublicHome
      business={business}
      barbers={barbers}
      services={services}
      portfolio={portfolio}
      workingHours={workingHours}
      instagramItems={instagramFeed.data}
    />
  );
}
