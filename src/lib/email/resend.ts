if (typeof window !== 'undefined') {
  throw new Error('This module can only be executed on the server.');
}
import { Resend } from 'resend';

function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

export function getResendClient(): Resend | null {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Resend] RESEND_API_KEY environment variable is not set.');
    }
    return null;
  }
  return new Resend(apiKey);
}

export function getEmailFromAddress(): string {
  return process.env.EMAIL_FROM || 'Barbod Barber <onboarding@resend.dev>';
}

export function getEmailReplyToAddress(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}
