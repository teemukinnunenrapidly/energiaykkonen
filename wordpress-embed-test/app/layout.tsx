import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'E1 Calculator - WordPress Embed Test',
  description: 'Test site for E1 Calculator WordPress embedding',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  )
}