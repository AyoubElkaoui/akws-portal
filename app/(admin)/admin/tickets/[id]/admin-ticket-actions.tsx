"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdminTicketActionsProps {
  ticketId: string
  currentStatus: string
}

export function AdminTicketActions({ ticketId, currentStatus }: AdminTicketActionsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function updateStatus() {
    if (status === currentStatus) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Er is iets misgegaan")
        return
      }
      toast.success("Status bijgewerkt")
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
        <CardTitle className="text-base">Acties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Status wijzigen</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_BEHANDELING">In behandeling</SelectItem>
              <SelectItem value="GESLOTEN">Gesloten</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="w-full"
            disabled={loading || status === currentStatus}
            onClick={updateStatus}
          >
            Status opslaan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
