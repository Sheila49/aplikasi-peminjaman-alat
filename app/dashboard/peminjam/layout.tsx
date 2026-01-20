"use client"
import type React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function PeminjamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar role="peminjam" />
      <main className="lg:pl-64">{children}</main>
    </div>
  )
}
