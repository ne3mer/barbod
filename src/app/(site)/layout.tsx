import { LanguageProvider } from "@/lib/i18n/context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublicBusiness } from "@/lib/public/business";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getPublicBusiness("barbod-barber");

  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-w-0 max-w-full">
        <SiteHeader />
        <div className="flex flex-1 flex-col min-w-0 max-w-full">{children}</div>
        <SiteFooter address={business?.address} />
      </div>
    </LanguageProvider>
  );
}
