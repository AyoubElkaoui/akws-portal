export default function PdfLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      {children}
    </div>
  )
}
