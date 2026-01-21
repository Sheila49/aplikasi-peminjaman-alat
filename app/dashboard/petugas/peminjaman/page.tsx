"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { CheckCircle, XCircle } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import type { Peminjaman } from "@/lib/types"

export default function PetugasPeminjamanPage() {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await peminjamanService.getAll(page)
      setPeminjamanList(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch (error) {
      toast.error("Gagal memuat data peminjaman")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (id: number) => {
    try {
      await peminjamanService.approve(id)
      toast.success("Peminjaman disetujui")
      fetchData()
    } catch (error) {
      toast.error("Gagal menyetujui peminjaman")
      console.error(error)
    }
  }

  const handleReject = async (id: number) => {
    try {
      await peminjamanService.reject(id)
      toast.success("Peminjaman ditolak")
      fetchData()
    } catch (error) {
      toast.error("Gagal menolak peminjaman")
      console.error(error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      approved: "bg-primary/10 text-primary",
      rejected: "bg-destructive/10 text-destructive",
      returned: "bg-accent/10 text-accent",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || ""}`}
      >
        {status}
      </span>
    )
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "user", label: "Peminjam", render: (p: Peminjaman) => p.user?.nama_lengkap || "-" },
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
    {
      key: "actions",
      label: "Aksi",
      render: (p: Peminjaman) =>
        p.status === "diajukan" ? (
          <div className="flex gap-1">
            <button
              onClick={() => handleApprove(p.id)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Setujui
            </button>
            <button
              onClick={() => handleReject(p.id)}
              className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
            >
              <XCircle className="h-3.5 w-3.5" />
              Tolak
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ]

  return (
    <>
      <Header title="Approve Peminjaman" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Daftar Peminjaman</h2>
          <p className="text-sm text-muted-foreground">Setujui atau tolak permintaan peminjaman</p>
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
