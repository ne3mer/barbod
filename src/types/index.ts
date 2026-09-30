/**
 * Shared application types.
 * Prefer importing table rows from `@/types/database`.
 */

export type {
  AppointmentStatus,
  Database,
  PortfolioCategory,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/database";

/** Wall-clock timezone for business availability (Budapest). */
export const BUSINESS_TIMEZONE = "Europe/Budapest" as const;
