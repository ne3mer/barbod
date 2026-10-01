import { APP_NAME } from "@/config/app";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export const metadata = {
  title: "Set Barber Password | Barbod Admin",
};

export default function AdminResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {APP_NAME}
        </p>
        <h1 className="text-2xl font-medium tracking-tight">Set Account Password</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Create or update your login password to access your barber workspace.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
