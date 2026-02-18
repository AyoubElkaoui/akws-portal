"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, CheckCircle2 } from "lucide-react"

interface ReviewFormProps {
  tenantSlug: string
  companyName: string
}

export function ReviewForm({ tenantSlug, companyName }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return

    setLoading(true)
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          customerName: name,
          rating,
          text: text || null,
        }),
      })

      const result = await res.json()
      if (result.success) {
        setSubmitted(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900">Bedankt voor uw review!</h3>
        <p className="text-sm text-slate-500 mt-2">
          Uw feedback is heel belangrijk voor {companyName}.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Beoordeling</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-slate-200"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Uw naam</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jan Jansen"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Uw ervaring (optioneel)</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Vertel over uw ervaring..."
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || rating === 0}>
        {loading ? "Bezig met verzenden..." : "Review plaatsen"}
      </Button>
    </form>
  )
}
