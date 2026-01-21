"use client"
import { useState } from "react"
import toast from "react-hot-toast"
import { FileBarChart, Download, Loader2, Calendar, FileSpreadsheet } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import * as XLSX from "xlsx"

export default function LaporanPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleDownloadPDF = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"
      
      // Build query params untuk backend
      let pdfUrl = `${baseURL}/laporan/peminjaman/pdf?`
      if (startDate) pdfUrl += `start_date=${startDate}&`
      if (endDate) pdfUrl += `end_date=${endDate}&`
      
      const response = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `laporan-peminjaman-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success("Laporan PDF berhasil diunduh")
    } catch (error: any) {
      console.error("PDF error:", error)
      toast.error(error.message || "Gagal mengunduh laporan PDF")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"
      
      // Build query params untuk backend
      let excelUrl = `${baseURL}/laporan/peminjaman/excel?`
      if (startDate) excelUrl += `start_date=${startDate}&`
      if (endDate) excelUrl += `end_date=${endDate}&`
      
      const response = await fetch(excelUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `laporan-peminjaman-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success("Laporan Excel berhasil diunduh")
    } catch (error: any) {
      console.error("Excel error:", error)
      toast.error(error.message || "Gagal mengunduh laporan Excel")
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
          <p className="mt-1 text-muted-foreground">Unduh laporan dalam format PDF atau Excel</p>
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

            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl gradient-primary py-4 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 disabled:opacity-50 glow-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    PDF
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadExcel}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:shadow-green-600/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5" />
                    Excel
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Biarkan tanggal kosong untuk mengunduh semua data
          </p>
        </div>
      </div>
    </>
  )
}