"use client"
import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { ClipboardList, RotateCcw, Clock, CheckCircle } from "lucide-react"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { pengembalianService } from "@/lib/services/pengembalian-service"

export default function PetugasDashboard() {
  const [stats, setStats] = useState({
    totalPeminjaman: 0,
    pendingPeminjaman: 0,
    approvedPeminjaman: 0,
    totalPengembalian: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [peminjamanRes, pengembalianRes] = await Promise.all([
          peminjamanService.getAll(1, 100),
          pengembalianService.getAll(1, 1),
        ])

        const diajukan = peminjamanRes.data.filter((p) => p.status === "diajukan").length
const disetujui = peminjamanRes.data.filter((p) => p.status === "disetujui").length

        setStats({
  totalPeminjaman: peminjamanRes.pagination.total,
  pendingPeminjaman: diajukan,
  approvedPeminjaman: disetujui,
  totalPengembalian: pengembalianRes.pagination.total,
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
      <Header title="Dashboard Petugas" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Ringkasan</h2>
          <p className="text-sm text-muted-foreground">Overview tugas petugas</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Peminjaman"
            value={isLoading ? "-" : stats.totalPeminjaman}
            icon={<ClipboardList className="h-6 w-6" />}
          />
          <StatCard
            title="Menunggu Persetujuan"
            value={isLoading ? "-" : stats.pendingPeminjaman}
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="Sudah Disetujui"
            value={isLoading ? "-" : stats.approvedPeminjaman}
            icon={<CheckCircle className="h-6 w-6" />}
          />
          <StatCard
            title="Total Pengembalian"
            value={isLoading ? "-" : stats.totalPengembalian}
            icon={<RotateCcw className="h-6 w-6" />}
          />
        </div>
      </div>
    </>
  )
}
