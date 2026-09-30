import { PagePlaceholder } from "@/components/layout/page-placeholder";

export const metadata = {
  title: "Book",
};

export default function BookPage() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <PagePlaceholder
        title="Booking"
        description="Multi-step booking (service, date, available slots, customer details, confirmation) will be implemented after the database schema and availability engine are in place."
      />
    </section>
  );
}
