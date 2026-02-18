import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/api/auth";
import { isModuleEnabled } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { tenantScope } from "@/lib/db/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star as StarIcon, Globe, MessageSquare } from "lucide-react";
import { CreateReviewDialog } from "./create-review-dialog";
import { SendRequestDialog } from "./send-request-dialog";
import { ReviewActions } from "./review-actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const user = await requireTenant();

  if (!(await isModuleEnabled(user.tenantId, "reviews"))) {
    redirect("/dashboard");
  }

  const [reviews, requests] = await Promise.all([
    db.review.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: { createdAt: "desc" },
      include: { testimonials: true },
    }),
    db.reviewRequest.findMany({
      where: { ...tenantScope(user.tenantId) },
      orderBy: { sentAt: "desc" },
      take: 10,
    }),
  ]);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0";
  const testimonialCount = reviews.filter(
    (r) => r.testimonials.length > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
          <p className="text-sm text-slate-500">
            Verzamel en beheer klantreviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SendRequestDialog />
          <CreateReviewDialog />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <StarIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Gemiddelde score</p>
              <p className="text-xl font-bold text-slate-900">
                {avgRating} / 5
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Totaal reviews</p>
              <p className="text-xl font-bold text-slate-900">
                {reviews.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Globe className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Op website</p>
              <p className="text-xl font-bold text-slate-900">
                {testimonialCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StarIcon className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center">
              Je hebt nog geen reviews. Voeg er een toe of stuur een verzoek
              naar een klant.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => {
            const isTestimonial = review.testimonials.length > 0;

            return (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Stars rating={review.rating} />
                      <p className="mt-2 font-medium text-slate-900">
                        {review.customerName}
                      </p>
                    </div>
                    <ReviewActions
                      reviewId={review.id}
                      isTestimonial={isTestimonial}
                    />
                  </div>

                  {review.text && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        review.source === "GOOGLE"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {review.source === "GOOGLE" ? "Google" : "Handmatig"}
                    </Badge>
                    {isTestimonial && (
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-green-600"
                      >
                        <Globe className="mr-1 h-3 w-3" />
                        Website
                      </Badge>
                    )}
                    <span className="ml-auto text-xs text-slate-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent requests */}
      {requests.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Recente verzoeken
            </h3>
            <div className="space-y-2">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-700">{req.customerEmail}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        req.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }
                    >
                      {req.completed ? "Ingevuld" : "Verstuurd"}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {formatDate(req.sentAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
