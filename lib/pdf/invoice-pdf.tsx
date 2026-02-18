import React from "react"
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#475569",
    marginTop: 2,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "right",
  },
  companyDetail: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "right",
  },
  logo: {
    width: 48,
    height: 48,
    objectFit: "contain",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  label: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  customerEmail: {
    fontSize: 9,
    color: "#475569",
    marginTop: 2,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  dateValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#334155",
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableCell: {
    fontSize: 9,
    color: "#334155",
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totalsContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  totalValue: {
    fontSize: 9,
    color: "#0f172a",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#0f172a",
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },
  paymentBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 14,
    marginTop: 24,
  },
  paymentTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  paymentLabel: {
    fontSize: 9,
    color: "#64748b",
    width: 60,
  },
  paymentValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
})

const vatLabels: Record<string, string> = {
  STANDAARD: "21%",
  LAAG: "9%",
  VRIJGESTELD: "0%",
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date))
}

interface InvoicePdfProps {
  invoice: {
    invoiceNumber: string
    customerName: string
    customerEmail: string
    subtotal: number
    vatRate: string
    vatAmount: number
    total: number
    dueDate: Date
    createdAt: Date
    paidAt: Date | null
    invoiceItems: { description: string; quantity: number; unitPrice: number; total: number }[]
    tenant: {
      companyName: string
      domain: string | null
      logo: string | null
      address: string | null
      postalCode: string | null
      city: string | null
      phone: string | null
      email: string | null
      kvkNumber: string | null
      btwNumber: string | null
      iban: string | null
      bic: string | null
    }
  }
}

export function InvoicePdf({ invoice }: InvoicePdfProps) {
  const t = invoice.tenant
  const hasAddress = t.address || t.city

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>FACTUUR</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <View>
              <Text style={styles.companyName}>{t.companyName}</Text>
              {hasAddress && (
                <Text style={styles.companyDetail}>
                  {t.address}{t.address && (t.postalCode || t.city) ? ", " : ""}
                  {t.postalCode} {t.city}
                </Text>
              )}
              {t.domain && <Text style={styles.companyDetail}>{t.domain}</Text>}
            </View>
            {t.logo && <Image src={t.logo} style={styles.logo} />}
          </View>
        </View>

        {/* Customer + dates */}
        <View style={styles.section}>
          <View>
            <Text style={styles.label}>Factuur aan</Text>
            <Text style={styles.customerName}>{invoice.customerName}</Text>
            <Text style={styles.customerEmail}>{invoice.customerEmail}</Text>
          </View>
          <View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Factuurdatum:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.createdAt)}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Vervaldatum:</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
            {invoice.paidAt && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Betaald op:</Text>
                <Text style={[styles.dateValue, { color: "#16a34a" }]}>{formatDate(invoice.paidAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Omschrijving</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Aantal</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Prijs</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Totaal</Text>
          </View>
          {invoice.invoiceItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.tableCellBold, styles.colTotal]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotaal</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>BTW ({vatLabels[invoice.vatRate] || "0%"})</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.vatAmount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Totaal</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment info */}
        {t.iban && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Betalingsgegevens</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>IBAN:</Text>
              <Text style={styles.paymentValue}>{t.iban}</Text>
            </View>
            {t.bic && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>BIC:</Text>
                <Text style={styles.paymentValue}>{t.bic}</Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>T.n.v.:</Text>
              <Text style={styles.paymentValue}>{t.companyName}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{t.companyName}</Text>
          {t.kvkNumber && <Text style={styles.footerText}>KvK: {t.kvkNumber}</Text>}
          {t.btwNumber && <Text style={styles.footerText}>BTW: {t.btwNumber}</Text>}
          {t.phone && <Text style={styles.footerText}>Tel: {t.phone}</Text>}
          {t.email && <Text style={styles.footerText}>{t.email}</Text>}
        </View>
      </Page>
    </Document>
  )
}
