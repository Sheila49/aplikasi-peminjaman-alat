"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Trash2 } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { pengembalianService } from "@/lib/services/pengembalian-service"
import type { Pengembalian } from "@/lib/types"

export default function PengembalianPage() {
  const [pengembalianList, setPengembalianList] = useState<Pengembalian[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

const fetchData = useCallback(async () => {
  setIsLoading(true)
  try {
    const res = await pengembalianService.getAll(page)

    if (!res.data || res.data.length === 0) {
      console.log("Belum ada data pengembalian")
      toast("Belum ada data pengembalian", {
        style: { background: "#3b82f6", color: "#fff" }, // biru ala "info"
      })
      setPengembalianList([]) // pastikan state kosong
      setTotalPages(1)
    } else {
      setPengembalianList(res.data)
      setTotalPages(res.pagination.totalPages)
    }
  } catch (error) {
    toast.error("Gagal memuat data pengembalian")
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}, [page])

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengembalian ini?")) return
    try {
      await pengembalianService.delete(id)
      toast.success("Pengembalian berhasil dihapus")
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus pengembalian")
      console.error(error)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "peminjaman", label: "ID Peminjaman", render: (p: Pengembalian) => p.peminjaman_id },
    {
      key: "tanggal_kembali_aktual",
      label: "Tgl Kembali",
      render: (p: Pengembalian) => new Date(p.tanggal_kembali_aktual).toLocaleDateString("id-ID"),
    },
    { key: "kondisi_alat", label: "Kondisi Alat" },
    { key: "catatan", label: "Catatan", render: (p: Pengembalian) => p.catatan || "-" },
    {
      key: "actions",
      label: "Aksi",
      render: (p: Pengembalian) => (
        <button
          onClick={() => handleDelete(p.id)}
          className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <>
      <Header title="Manajemen Pengembalian" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Daftar Pengembalian</h2>
          <p className="text-sm text-muted-foreground">Kelola data pengembalian alat</p>
        </div>

        <DataTable
          columns={columns}
          data={pengembalianList}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}
