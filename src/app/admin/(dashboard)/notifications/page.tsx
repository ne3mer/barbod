import { requireAdminContext } from "@/lib/auth/session";
import { fetchNotificationLogsAction } from "@/app/admin/(dashboard)/notifications/actions";
import { NotificationsManager } from "@/components/admin/notifications-manager";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Email Logs | Barbod Barber Admin",
};

export default async function NotificationsPage() {
  const context = await requireAdminContext();

  // Restrict email logs to business owner
  if (context.role !== "owner") {
    redirect("/admin/appointments");
  }

  const { logs } = await fetchNotificationLogsAction();

  return <NotificationsManager initialLogs={logs || []} />;
}
