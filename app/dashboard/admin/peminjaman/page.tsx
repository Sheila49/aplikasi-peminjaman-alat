"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Trash2, CheckCircle, XCircle } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import type { Peminjaman, StatusPeminjaman } from "@/lib/types"

export default function PeminjamanPage() {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const statusLabel: Record<StatusPeminjaman, string> = {
  diajukan: "Menunggu Persetujuan",
  disetujui: "Sedang Dipinjam",
  dikembalikan: "Sudah Dikembalikan",
  ditolak: "Ditolak",
}

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

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus peminjaman ini?")) return
    try {
      await peminjamanService.delete(id)
      toast.success("Peminjaman berhasil dihapus")
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus peminjaman")
      console.error(error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      diajukan: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      disetujui: "bg-primary/20 text-primary border border-primary/30",
      ditolak: "bg-destructive/20 text-destructive border border-destructive/30",
      dikembalikan: "bg-accent/20 text-accent border border-accent/30",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${styles[status] || ""}`}
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
      render: (p: Peminjaman) => (
        <div className="flex gap-1">
          {p.status === "diajukan" && (
            <>
              <button
                onClick={() => handleApprove(p.id)}
                className="rounded-xl p-2 text-primary transition-all duration-300 hover:bg-primary/10"
                title="Setujui"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReject(p.id)}
                className="rounded-xl p-2 text-destructive transition-all duration-300 hover:bg-destructive/10"
                title="Tolak"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(p.id)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Header title="Manajemen Peminjaman" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Daftar Peminjaman</h2>
          <p className="mt-1 text-muted-foreground">Kelola semua peminjaman alat</p>
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
