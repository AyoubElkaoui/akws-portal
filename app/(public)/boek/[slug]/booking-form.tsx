"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Clock } from "lucide-react"

interface BookingFormProps {
  tenantSlug: string
}

export function BookingForm({ tenantSlug }: BookingFormProps) {
  const [date, setDate] = useState("")
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!date) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    fetch(`/api/public/appointments/available?tenantSlug=${tenantSlug}&date=${date}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          setSlots(result.data.slots || [])
        } else {
          setSlots([])
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [date, tenantSlug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !date) return

    setLoading(true)
    try {
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || null,
          notes: notes || null,
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
        <h3 className="text-lg font-semibold text-slate-900">Afspraak bevestigd!</h3>
        <p className="text-sm text-slate-500 mt-2">
          U ontvangt een bevestiging per e-mail.
        </p>
      </div>
    )
  }

  // Minimum date is tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Datum</Label>
        <Input
          id="date"
          type="date"
          min={minDateStr}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {date && (
        <div className="space-y-2">
          <Label>Beschikbare tijden</Label>
          {loadingSlots ? (
            <p className="text-sm text-slate-500">Beschikbaarheid laden...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500">Geen beschikbare tijden op deze datum.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                    selectedSlot?.startTime === slot.startTime
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Naam</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Uw volledige naam"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mailadres</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="naam@voorbeeld.nl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefoonnummer (optioneel)</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="06-12345678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Opmerking (optioneel)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Eventuele opmerkingen..."
          rows={3}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !selectedSlot || !date}
      >
        {loading ? "Bezig met boeken..." : "Afspraak bevestigen"}
      </Button>
    </form>
  )
}
