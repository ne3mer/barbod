import {
  getPublicBusiness,
  getPublicServices,
  getPublicBarbers,
  getPublicBarberServicesMap,
} from "@/lib/public/business";
import { BookingFlow } from "@/components/public/booking-flow";

export const metadata = {
  title: "Book Appointment | Barbod Barber Budapest",
  description:
    "Select your barber, pick your service, choose a date and time slot, and confirm your appointment online.",
};

export default async function PublicBookingPage() {
  const business = await getPublicBusiness("barbod-barber");

  if (!business) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-2xl font-bold">Barbod Barber</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Business is currently not configured.
        </p>
      </div>
    );
  }

  const [barbers, services, barberServicesMap] = await Promise.all([
    getPublicBarbers(business.id),
    getPublicServices(business.id),
    getPublicBarberServicesMap(),
  ]);

  return (
    <BookingFlow
      business={business}
      barbers={barbers}
      services={services}
      barberServicesMap={barberServicesMap}
    />
  );
}
