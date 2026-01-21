import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ToastProvider } from "@/components/toast-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aplikasi Peminjaman Alat",
  description: "Sistem manajemen peminjaman alat",
  generator: 'v0.app',
  icons: {
    icon: "/LOGO STMJ.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} antialiased`}>
        <ToastProvider />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
