import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dealer Buy Score — Auction Intelligence for Dealers',
  description: 'Instant dealer-focused buy/pass recommendations for auction vehicles. Enter a VIN, price, and mileage to get a scored recommendation with full financial breakdown.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
