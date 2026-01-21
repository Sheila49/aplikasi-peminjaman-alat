"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { useAuthStore } from "@/store/auth-store"
import type { Peminjaman } from "@/lib/types"

export default function PeminjamPeminjamanPage() {
  const { user } = useAuthStore()
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const res = await peminjamanService.getByUser(user.id, page)
      setPeminjamanList(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch (error) {
      toast.error("Gagal memuat data peminjaman")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page, user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      approved: "bg-primary/10 text-primary",
      rejected: "bg-destructive/10 text-destructive",
      returned: "bg-accent/10 text-accent",
    }
    const labels: Record<string, string> = {
      pending: "Menunggu",
      approved: "Disetujui",
      rejected: "Ditolak",
      returned: "Dikembalikan",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ""}`}
      >
        {labels[status] || status}
      </span>
    )
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "alat", label: "Alat", render: (p: Peminjaman) => p.alat?.nama_alat || "-" },
    { key: "jumlah", label: "Jumlah" },
    {
      key: "tanggal_pinjam",
      label: "Tgl Pinjam",
      render: (p: Peminjaman) => new Date(p.tanggal_pinjam).toLocaleDateString("id-ID"),
    },
    {
      key: "tanggal_kembali",
      label: "Tgl Kembali",
      render: (p: Peminjaman) => new Date(p.tanggal_kembali).toLocaleDateString("id-ID"),
    },
    { key: "status", label: "Status", render: (p: Peminjaman) => getStatusBadge(p.status) },
    { key: "catatan", label: "Catatan", render: (p: Peminjaman) => p.catatan || "-" },
  ]

  return (
    <>
      <Header title="Peminjaman Saya" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Riwayat Peminjaman</h2>
          <p className="text-sm text-muted-foreground">Daftar semua peminjaman Anda</p>
        </div>

        <DataTable
          columns={columns}
          data={peminjamanList}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}
