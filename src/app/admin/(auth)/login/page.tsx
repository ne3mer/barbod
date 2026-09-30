import { APP_NAME } from "@/config/app";

import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  title: "Admin login",
};

export default function AdminLoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {APP_NAME}
        </p>
        <h1 className="text-2xl font-medium tracking-tight">Admin sign in</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sign in to manage appointments, services, and your studio.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
