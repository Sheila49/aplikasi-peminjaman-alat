"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { logService } from "@/lib/services/log-service"
import type { LogAktivitas } from "@/lib/types"

export default function LogsPage() {
  const [logs, setLogs] = useState<LogAktivitas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await logService.getAll(page)
      setLogs(res.data)
      setTotalPages(res.totalPages)
    } catch (error) {
      toast.error("Gagal memuat log aktivitas")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns = [
    { key: "id", label: "ID" },
    { key: "user", label: "User", render: (log: LogAktivitas) => log.user?.name || "-" },
    { key: "aksi", label: "Aksi" },
    { key: "tabel", label: "Tabel" },
    { key: "data_id", label: "Data ID" },
    { key: "keterangan", label: "Keterangan", render: (log: LogAktivitas) => log.keterangan || "-" },
    {
      key: "created_at",
      label: "Waktu",
      render: (log: LogAktivitas) => (log.created_at ? new Date(log.created_at).toLocaleString("id-ID") : "-"),
    },
  ]

  return (
    <>
      <Header title="Log Aktivitas" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Log Aktivitas Sistem</h2>
          <p className="text-sm text-muted-foreground">Riwayat semua aktivitas dalam sistem</p>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}
