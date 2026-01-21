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
    diajukan: "bg-yellow-500/10 text-yellow-500",
    disetujui: "bg-primary/10 text-primary",
    ditolak: "bg-destructive/10 text-destructive",
    dipinjam: "bg-blue-500/10 text-blue-500",
    dikembalikan: "bg-green-500/10 text-green-500",
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
  { key: "peminjam", label: "Peminjam", render: (p: Peminjaman) => p.peminjam?.nama_lengkap || "-" },
  { key: "alat", label: "Alat", render: (p: Peminjaman) => p.alat?.nama_alat || "-" },
  { key: "jumlah_pinjam", label: "Jumlah", render: (p: Peminjaman) => p.jumlah_pinjam ?? "-" },
  { 
    key: "tanggal_pinjam", 
    label: "Tgl Pinjam", 
    render: (p: Peminjaman) => 
      p.tanggal_pinjam 
        ? new Date(p.tanggal_pinjam).toLocaleDateString("id-ID") 
        : "-" 
  },
  { 
    key: "tanggal_kembali_rencana", 
    label: "Tgl Kembali", 
    render: (p: Peminjaman) => 
      p.tanggal_kembali_rencana 
        ? new Date(p.tanggal_kembali_rencana).toLocaleDateString("id-ID") 
        : "-" 
  },
  { key: "status", label: "Status", render: (p: Peminjaman) => getStatusBadge(p.status) },
  {
  key: "actions",
  label: "Aksi",
  render: (p: Peminjaman) => (
    <div className="flex gap-1">
      <button
        onClick={() => handleApprove(p.id)}
        disabled={p.status !== "diajukan"}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
          p.status === "diajukan"
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Setujui
      </button>
      <button
        onClick={() => handleReject(p.id)}
        disabled={p.status !== "diajukan"}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
          p.status === "diajukan"
            ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        <XCircle className="h-3.5 w-3.5" />
        Tolak
      </button>
    </div>
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
