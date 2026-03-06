"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Code, Copy, Check } from "lucide-react"

interface TrackingCodeProps {
  tenantId: string
  baseUrl: string
}

export function TrackingCode({ tenantId, baseUrl }: TrackingCodeProps) {
  const [copied, setCopied] = useState(false)

  const snippet = `<script src="${baseUrl}/tracking.js" data-endpoint="${baseUrl}" data-tenant="${tenantId}" defer></script>`

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Code className="h-4 w-4" />
          Tracking code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500 mb-3">
          Plaats deze code vlak voor de sluitende <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">&lt;/head&gt;</code> tag op je website.
        </p>
        <div className="relative">
          <pre className="rounded-lg bg-slate-900 p-4 text-xs text-green-400 overflow-x-auto">
            <code>{snippet}</code>
          </pre>
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 h-7"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Gekopieerd
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3 w-3" />
                Kopieer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
