import Link from "next/link";

import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
      <PagePlaceholder
        title="Public website"
        description="Premium landing page, services, portfolio, and bilingual content will live here. Business-specific branding and content will be loaded from the database in a later phase."
      />
      <div className="mt-8">
        <Link href="/book" className={buttonVariants({ size: "lg" })}>
          Start booking flow
        </Link>
      </div>
    </section>
  );
}
