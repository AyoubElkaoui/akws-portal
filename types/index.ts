import type { Role, Plan, ProjectStatus, InvoiceStatus, TicketStatus, TicketPriority } from "@prisma/client"

export type { Role, Plan, ProjectStatus, InvoiceStatus, TicketStatus, TicketPriority }

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  tenantId: string | null
  avatar: string | null
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface ModuleConfig {
  slug: string
  name: string
  description: string
  icon: string
  href: string
  plans: Plan[]
}

export const MODULE_DEFINITIONS: ModuleConfig[] = [
  {
    slug: "projecten",
    name: "Projecten",
    description: "Beheer je projecten, milestones en revisies",
    icon: "FolderKanban",
    href: "/dashboard/projecten",
    plans: ["STARTER", "BUSINESS", "PREMIUM"],
  },
  {
    slug: "website",
    name: "Website",
    description: "Monitor je website uptime, snelheid en SSL",
    icon: "Globe",
    href: "/dashboard/website",
    plans: ["STARTER", "BUSINESS", "PREMIUM"],
  },
  {
    slug: "facturatie",
    name: "Facturatie",
    description: "Maak en verstuur facturen, volg betalingen",
    icon: "Receipt",
    href: "/dashboard/facturen",
    plans: ["BUSINESS", "PREMIUM"],
  },
  {
    slug: "crm",
    name: "CRM",
    description: "Beheer je klanten en contacten",
    icon: "Users",
    href: "/dashboard/crm",
    plans: ["BUSINESS", "PREMIUM"],
  },
  {
    slug: "bestanden",
    name: "Bestanden",
    description: "Upload en deel bestanden veilig",
    icon: "FileBox",
    href: "/dashboard/bestanden",
    plans: ["BUSINESS", "PREMIUM"],
  },
  {
    slug: "email",
    name: "E-mail",
    description: "Verstuur nieuwsbrieven en bekijk formulier-inzendingen",
    icon: "Mail",
    href: "/dashboard/email",
    plans: ["PREMIUM"],
  },
  {
    slug: "afspraken",
    name: "Afspraken",
    description: "Plan afspraken en beheer je agenda",
    icon: "CalendarDays",
    href: "/dashboard/afspraken",
    plans: ["PREMIUM"],
  },
  {
    slug: "statistieken",
    name: "Statistieken",
    description: "Bekijk bezoekersdata en website-analyses",
    icon: "BarChart3",
    href: "/dashboard/statistieken",
    plans: ["STARTER", "BUSINESS", "PREMIUM"],
  },
  {
    slug: "reviews",
    name: "Reviews",
    description: "Verzamel en beheer klantreviews",
    icon: "Star",
    href: "/dashboard/reviews",
    plans: ["PREMIUM"],
  },
]

export const PLAN_LABELS: Record<Plan, string> = {
  STARTER: "Starter",
  BUSINESS: "Business",
  PREMIUM: "Premium",
}

export const PLAN_PRICES: Record<Plan, number> = {
  STARTER: 29,
  BUSINESS: 59,
  PREMIUM: 99,
}
