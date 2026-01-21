"use client"
import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { ClipboardList, Clock, CheckCircle, RotateCcw } from "lucide-react"
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await peminjamanService.getByUser(1, 100) // ✅ tanpa userId

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
  }, []) // ✅ tidak perlu dependensi user.id

  return (
    <>
      <Header title="Dashboard Peminjam" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Selamat datang, {user?.nama_lengkap}!
          </h2>
          <p className="text-sm text-muted-foreground">
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
      </div>
    </>
  )
}