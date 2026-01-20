"use client"
import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Users, Package, ClipboardList, RotateCcw, TrendingUp, Activity } from "lucide-react"
import { userService } from "@/lib/services/user-service"
import { alatService } from "@/lib/services/alat-service"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { pengembalianService } from "@/lib/services/pengembalian-service"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    alat: 0,
    peminjaman: 0,
    pengembalian: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, alatRes, peminjamanRes, pengembalianRes] = await Promise.all([
          userService.getAll(1, 1),
          alatService.getAll(1, 1),
          peminjamanService.getAll(1, 1),
          pengembalianService.getAll(1, 1),
        ])
        setStats({
  users: usersRes.pagination.total,
  alat: alatRes.pagination.total,
  peminjaman: peminjamanRes.pagination.total,
  pengembalian: pengembalianRes.pagination.total,
})
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <>
      <Header title="Dashboard Admin" />
      <div className="p-6 animate-fade-in">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Ringkasan</h2>
          <p className="mt-1 text-muted-foreground">Overview sistem peminjaman alat</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={isLoading ? "-" : stats.users}
            icon={<Users className="h-6 w-6" />}
            trend="12%"
            trendUp={true}
          />
          <StatCard
            title="Total Alat"
            value={isLoading ? "-" : stats.alat}
            icon={<Package className="h-6 w-6" />}
            trend="5%"
            trendUp={true}
          />
          <StatCard
            title="Total Peminjaman"
            value={isLoading ? "-" : stats.peminjaman}
            icon={<ClipboardList className="h-6 w-6" />}
            trend="8%"
            trendUp={true}
          />
          <StatCard
            title="Total Pengembalian"
            value={isLoading ? "-" : stats.pengembalian}
            icon={<RotateCcw className="h-6 w-6" />}
            trend="3%"
            trendUp={true}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Aktivitas Terkini</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Pantau aktivitas peminjaman dan pengembalian alat secara real-time dari dashboard ini.
            </p>
          </div>
          <div className="rounded-2xl glass p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Status Sistem</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Semua layanan berjalan normal. Tidak ada gangguan yang terdeteksi.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
