import { db } from "@/lib/db";

export type HealthStatus = "healthy" | "warning" | "critical";

export interface TenantHealth {
  tenantId: string;
  companyName: string;
  status: HealthStatus;
  issues: string[];
}

export async function calculateHealthScores(): Promise<TenantHealth[]> {
  const tenants = await db.tenant.findMany({
    where: { active: true },
    select: {
      id: true,
      companyName: true,
      invoices: {
        where: { status: "VERLOPEN" },
        select: { id: true },
      },
      tickets: {
        where: { status: { in: ["OPEN", "IN_BEHANDELING"] } },
        select: {
          id: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: "desc" as const },
            take: 1,
            select: { senderRole: true, createdAt: true },
          },
        },
      },
      websiteStatus: {
        orderBy: { lastCheck: "desc" as const },
        take: 1,
        select: { isOnline: true },
      },
    },
  });

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return tenants.map((tenant) => {
    const issues: string[] = [];

    // Check overdue invoices
    if (tenant.invoices.length > 0) {
      issues.push(`${tenant.invoices.length} verlopen factuur${tenant.invoices.length > 1 ? "en" : ""}`);
    }

    // Check unanswered tickets (last message from client, older than 24h)
    const unansweredTickets = tenant.tickets.filter((t) => {
      const lastMsg = t.messages[0];
      return (
        lastMsg &&
        lastMsg.senderRole === "CLIENT" &&
        lastMsg.createdAt < twentyFourHoursAgo
      );
    });
    if (unansweredTickets.length > 0) {
      issues.push(`${unansweredTickets.length} onbeantwoord ticket${unansweredTickets.length > 1 ? "s" : ""}`);
    }

    // Check website status
    const ws = tenant.websiteStatus[0];
    if (ws && !ws.isOnline) {
      issues.push("Website offline");
    }

    let status: HealthStatus = "healthy";
    if (issues.some((i) => i.includes("offline") || i.includes("verlopen"))) {
      status = "critical";
    } else if (issues.length > 0) {
      status = "warning";
    }

    return {
      tenantId: tenant.id,
      companyName: tenant.companyName,
      status,
      issues,
    };
  });
}
