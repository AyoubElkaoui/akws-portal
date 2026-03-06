"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Mail,
  Loader2,
  RefreshCw,
  Send,
  ArrowLeft,
  Circle,
  Info,
} from "lucide-react"

interface EmailAccount {
  id: string
  email: string
  displayName: string | null
  imapHost: string
  active: boolean
}

interface MailMessage {
  id: string
  uid: number
  from: { name: string; address: string } | null
  to: string[]
  subject: string
  date: string
  seen: boolean
}

export function MailboxTab() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMail, setLoadingMail] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/email/accounts")
      const result = await res.json()
      if (result.success) {
        setAccounts(result.data)
        if (result.data.length > 0 && !selectedAccount) {
          setSelectedAccount(result.data[0].id)
          fetchMail(result.data[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchMail(accountId: string) {
    setLoadingMail(true)
    try {
      const res = await fetch(`/api/email/mailbox?accountId=${accountId}`)
      const result = await res.json()
      if (result.success) {
        setMessages(result.data)
      } else {
        toast.error(result.error || "Kan inbox niet ophalen")
      }
    } catch {
      toast.error("Fout bij ophalen e-mails")
    } finally {
      setLoadingMail(false)
    }
  }

  function selectAccount(id: string) {
    setSelectedAccount(id)
    fetchMail(id)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center mb-2">
              Er zijn nog geen e-mailaccounts gekoppeld.
            </p>
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <Info className="h-4 w-4" />
              <p>Neem contact op met de beheerder om een account te laten instellen.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Account selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {accounts.map((acc) => (
          <Button
            key={acc.id}
            variant={selectedAccount === acc.id ? "default" : "outline"}
            size="sm"
            onClick={() => selectAccount(acc.id)}
          >
            {acc.email}
          </Button>
        ))}
        {selectedAccount && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchMail(selectedAccount)}
              disabled={loadingMail}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingMail ? "animate-spin" : ""}`} />
              Vernieuwen
            </Button>
            <Button size="sm" onClick={() => setShowCompose(true)}>
              <Send className="h-3 w-3 mr-1" />
              Nieuw bericht
            </Button>
          </>
        )}
      </div>

      {/* Compose dialog */}
      {showCompose && selectedAccount && (
        <ComposeCard
          accountId={selectedAccount}
          onClose={() => setShowCompose(false)}
        />
      )}

      {/* Inbox */}
      {loadingMail ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400 mr-2" />
            <span className="text-sm text-slate-500">Inbox laden...</span>
          </CardContent>
        </Card>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Geen e-mails gevonden.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer ${
                  !msg.seen ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="pt-1.5">
                  {!msg.seen && (
                    <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${!msg.seen ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                      {msg.from?.name || msg.from?.address || "Onbekend"}
                    </p>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(msg.date).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!msg.seen ? "font-medium text-slate-800" : "text-slate-600"}`}>
                    {msg.subject}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ComposeCard({ accountId, onClose }: { accountId: string; onClose: () => void }) {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch("/api/email/mailbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to,
          subject,
          text: body,
          html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
        }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error || "Fout bij versturen")
        return
      }
      toast.success("E-mail verstuurd!")
      onClose()
    } catch {
      toast.error("Fout bij versturen")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Nieuw bericht</CardTitle>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            Annuleren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Aan</Label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="ontvanger@voorbeeld.nl"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Onderwerp</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Onderwerp"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bericht</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Typ je bericht..."
              rows={6}
              required
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full">
            <Send className="h-3 w-3 mr-1" />
            {sending ? "Versturen..." : "Verstuur"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
