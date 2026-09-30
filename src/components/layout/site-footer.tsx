import { APP_NAME } from "@/config/app";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p>{APP_NAME}</p>
        <p className="text-xs">Appointment booking platform</p>
      </div>
    </footer>
  );
}
