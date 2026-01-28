"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { ClipboardList, Clock, CheckCircle, RotateCcw, Loader2 } from "lucide-react"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { useAuthStore } from "@/store/auth-store"

export default function PeminjamDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    returned: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for client-side hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      if (!isHydrated) return // Wait until hydrated
      
      setIsLoading(true)
      try {
        const res = await peminjamanService.getByUser(1, 100)

        const pending = res.data.filter((p) => p.status === "diajukan").length
        const approved = res.data.filter((p) => p.status === "disetujui").length
        const returned = res.data.filter((p) => p.status === "dikembalikan").length

        setStats({
          total: res.pagination.total,
          pending,
          approved,
          returned,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [isHydrated])

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <>
        <Header title="Dashboard Peminjam" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Dashboard Peminjam" />
      <div className="p-6 animate-fade-in space-y-6">
        <div className="rounded-2xl glass border border-border/30 p-6">
          <h2 className="text-2xl font-bold text-foreground">
            Selamat datang, {user?.nama_lengkap || "Peminjam"}! 👋
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ringkasan aktivitas peminjaman Anda
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Peminjaman"
            value={isLoading ? "-" : stats.total}
            icon={<ClipboardList className="h-6 w-6" />}
          />
          <StatCard
            title="Menunggu Persetujuan"
            value={isLoading ? "-" : stats.pending}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="Sedang Dipinjam"
            value={isLoading ? "-" : stats.approved}
            icon={<CheckCircle className="h-6 w-6" />}
          />
          <StatCard
            title="Sudah Dikembalikan"
            value={isLoading ? "-" : stats.returned}
            icon={<RotateCcw className="h-6 w-6" />}
          />
        </div>

        {/* Recent Activity Section */}
        {!isLoading && stats.total === 0 && (
          <div className="rounded-2xl glass border border-border/30 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Belum Ada Peminjaman</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Mulai ajukan peminjaman alat laboratorium sekarang
            </p>
          </div>
        )}
      </div>
    </>
  )
}