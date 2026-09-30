import { LanguageProvider } from "@/lib/i18n/context";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </div>
    </LanguageProvider>
  );
}
