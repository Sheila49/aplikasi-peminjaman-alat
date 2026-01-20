"use client"
import { useState } from "react"
import toast from "react-hot-toast"
import { FileBarChart, Download, Loader2, Calendar } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { reportService } from "@/lib/services/report-service"

export default function LaporanPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const blob = await reportService.getPeminjamanReport(startDate, endDate)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `laporan-peminjaman-${new Date().toISOString().split("T")[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Laporan berhasil diunduh")
    } catch (error) {
      toast.error("Gagal mengunduh laporan")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header title="Cetak Laporan" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Cetak Laporan Peminjaman</h2>
          <p className="mt-1 text-muted-foreground">Unduh laporan dalam format PDF</p>
        </div>

        <div className="mx-auto max-w-lg rounded-3xl glass-strong p-8">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary glow-primary">
              <FileBarChart className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-card-foreground mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3.5 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-card-foreground mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3.5 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
            </div>

            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 disabled:opacity-50 glow-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Unduh Laporan
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Biarkan tanggal kosong untuk mengunduh semua data
          </p>
        </div>
      </div>
    </>
  )
}
