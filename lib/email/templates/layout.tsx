interface EmailLayoutProps {
  companyName?: string
  children: string
}

export function renderEmailLayout({ companyName, children }: EmailLayoutProps): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${companyName || "AK Web Solutions"}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { padding: 24px 32px; border-bottom: 1px solid #e2e8f0; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .body { padding: 32px; color: #334155; font-size: 14px; line-height: 1.6; }
    .body p { margin: 0 0 16px; }
    .body p:last-child { margin-bottom: 0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
    .btn:hover { background-color: #1e293b; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .table th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .table th:last-child, .table td:last-child { text-align: right; }
    .table td { padding: 8px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .totals { margin-top: 16px; text-align: right; }
    .totals .row { display: flex; justify-content: flex-end; gap: 24px; padding: 4px 0; font-size: 13px; color: #64748b; }
    .totals .total-row { font-weight: 700; font-size: 16px; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 4px; }
    .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #94a3b8; }
    .highlight { background-color: #f1f5f9; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .highlight strong { color: #0f172a; }
    .text-green { color: #16a34a; }
    .text-red { color: #dc2626; }
    .text-right { text-align: right; }
    .mt-4 { margin-top: 16px; }
    .mb-4 { margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>${companyName || "AK Web Solutions"}</h1>
      </div>
      <div class="body">
        ${children}
      </div>
      <div class="footer">
        <p>Verzonden via AK Web Solutions</p>
      </div>
    </div>
  </div>
</body>
</html>`
}
