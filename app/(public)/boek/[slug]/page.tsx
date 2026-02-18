import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookingForm } from "./booking-form"

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      companyName: true,
      primaryColor: true,
      phone: true,
      email: true,
    },
  })

  if (!tenant) notFound()

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold" style={{ color: tenant.primaryColor }}>
          {tenant.companyName}
        </CardTitle>
        <p className="text-sm text-slate-500">
          Plan een afspraak in via onderstaand formulier.
        </p>
      </CardHeader>
      <CardContent>
        <BookingForm tenantSlug={slug} />
      </CardContent>
    </Card>
  )
}
