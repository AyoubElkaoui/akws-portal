import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ActivityType =
  | "TICKET_CREATED"
  | "TICKET_REPLY"
  | "TICKET_STATUS_CHANGED"
  | "MILESTONE_COMPLETED"
  | "PROJECT_STATUS_CHANGED"
  | "INVOICE_SENT"
  | "INVOICE_PAID"
  | "INVOICE_OVERDUE"
  | "WEBSITE_DOWN"
  | "WEBSITE_UP"
  | "SSL_EXPIRING"
  | "REVISION_REQUESTED"
  | "REVISION_STATUS_CHANGED";

export async function logActivity(
  tenantId: string,
  type: ActivityType,
  title: string,
  options?: {
    message?: string;
    link?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return db.activityEvent.create({
    data: {
      tenantId,
      type,
      title,
      message: options?.message,
      link: options?.link,
      metadata: options?.metadata ?? undefined,
    },
  });
}
