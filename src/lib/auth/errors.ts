/** Map Supabase Auth errors to short, user-safe messages. */
export function getAuthErrorMessage(error: {
  message?: string;
  code?: string;
  status?: number;
}): string {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "Invalid email or password.";
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (message.includes("rate limit") || code.includes("over_request")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Unable to reach the sign-in service. Check your connection.";
  }

  return "Unable to sign in. Please try again.";
}
