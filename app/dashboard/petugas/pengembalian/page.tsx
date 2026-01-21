"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { pengembalianService } from "@/lib/services/pengembalian-service"
import type { Pengembalian } from "@/lib/types"

export default function PetugasPengembalianPage() {
  const [pengembalianList, setPengembalianList] = useState<Pengembalian[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await pengembalianService.getAll(page)
      setPengembalianList(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch (error) {
      toast.error("Gagal memuat data pengembalian")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getKondisiBadge = (kondisi: string) => {
    const isGood = kondisi.toLowerCase() === "baik"
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isGood ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        }`}
      >
        {kondisi}
      </span>
    )
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "peminjaman_id", label: "ID Peminjaman" },
    {
      key: "tanggal_kembali_aktual",
      label: "Tgl Kembali",
      render: (p: Pengembalian) => new Date(p.tanggal_kembali_aktual).toLocaleDateString("id-ID"),
    },
    { key: "kondisi_alat", label: "Kondisi", render: (p: Pengembalian) => getKondisiBadge(p.kondisi_alat) },
    { key: "catatan", label: "Catatan", render: (p: Pengembalian) => p.catatan || "-" },
  ]

  return (
    <>
      <Header title="Monitor Pengembalian" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Daftar Pengembalian</h2>
          <p className="text-sm text-muted-foreground">Monitor semua pengembalian alat</p>
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
