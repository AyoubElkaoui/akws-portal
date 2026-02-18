"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const DAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"]

interface Slot {
  dayOfWeek: number
  startTime: string
  endTime: string
  active: boolean
}

interface AvailabilityFormProps {
  initialSlots: Slot[]
}

export function AvailabilityForm({ initialSlots }: AvailabilityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Initialize with all 7 days, merging with existing slots
  const [slots, setSlots] = useState<Slot[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const existing = initialSlots.find((s) => s.dayOfWeek === i)
      return existing || { dayOfWeek: i, startTime: "09:00", endTime: "17:00", active: i >= 1 && i <= 5 }
    })
  })

  function updateSlot(dayOfWeek: number, field: keyof Slot, value: string | boolean) {
    setSlots((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    )
  }

  async function handleSave() {
    setLoading(true)

    try {
      const res = await fetch("/api/appointments/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }

      toast.success("Beschikbaarheid opgeslagen")
      router.refresh()
    } catch {
      toast.error("Er is iets misgegaan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Beschikbaarheid</CardTitle>
        <CardDescription>
          Stel in wanneer klanten een afspraak kunnen boeken.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {slots.map((slot) => (
          <div key={slot.dayOfWeek} className="flex items-center gap-4">
            <div className="w-24">
              <span className="text-sm font-medium text-slate-700">
                {DAY_NAMES[slot.dayOfWeek]}
              </span>
            </div>
            <Switch
              checked={slot.active}
              onCheckedChange={(checked) => updateSlot(slot.dayOfWeek, "active", checked)}
            />
            {slot.active && (
              <>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, "startTime", e.target.value)}
                  className="w-28"
                />
                <span className="text-sm text-slate-400">tot</span>
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, "endTime", e.target.value)}
                  className="w-28"
                />
              </>
            )}
            {!slot.active && (
              <span className="text-sm text-slate-400">Gesloten</span>
            )}
          </div>
        ))}
        <Button onClick={handleSave} disabled={loading} className="mt-4">
          {loading ? "Opslaan..." : "Beschikbaarheid opslaan"}
        </Button>
      </CardContent>
    </Card>
  )
}
