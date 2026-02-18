import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewForm } from "./review-form"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: { id: true, companyName: true, primaryColor: true, logo: true },
  })

  if (!tenant) notFound()

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold" style={{ color: tenant.primaryColor }}>
          {tenant.companyName}
        </CardTitle>
        <p className="text-sm text-slate-500">
          Wij waarderen uw feedback! Laat een review achter.
        </p>
      </CardHeader>
      <CardContent>
        <ReviewForm tenantSlug={slug} companyName={tenant.companyName} />
      </CardContent>
    </Card>
  )
}
