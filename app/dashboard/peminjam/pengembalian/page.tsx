"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { RotateCcw, Loader2, Calendar, Package, AlertTriangle, Filter, ChevronDown, X, ArrowUpDown } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Modal } from "@/components/dashboard/modal"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { pengembalianSchema, type PengembalianFormData } from "@/lib/validations"
import { useAuthStore } from "@/store/auth-store"
import type { Peminjaman } from "@/lib/types"
import axios from "axios"

type StatusFilter = "all" | "terlambat" | "tepat_waktu" | "mendekati_deadline"
type SortField = "tanggal_kembali_rencana" | "alat" | "jumlah_pinjam" | "keterlambatan"
type SortOrder = "asc" | "desc"

export default function PeminjamPengembalianPage() {
  const { user } = useAuthStore()
  
  console.log("✨ Component rendered")
  console.log("👤 Current user:", user)
  
  if (!user) {
    console.warn("⚠️ User is not logged in!")
  }
  const [approvedPeminjaman, setApprovedPeminjaman] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedDenda, setEstimatedDenda] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortField, setSortField] = useState<SortField>("tanggal_kembali_rencana")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PengembalianFormData>({
    resolver: zodResolver(pengembalianSchema),
  })

  const kondisiAlat = watch("kondisi_alat")

  useEffect(() => {
    if (selectedPeminjaman) {
      calculateDenda()
    }
  }, [kondisiAlat, selectedPeminjaman])

  const calculateDenda = () => {
    if (!selectedPeminjaman?.tanggal_kembali_rencana) return
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dueDate = new Date(selectedPeminjaman.tanggal_kembali_rencana)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = today.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const keterlambatan = diffDays > 0 ? diffDays : 0
    const dendaKeterlambatan = keterlambatan * 10000
    
    setEstimatedDenda(dendaKeterlambatan)
  }

  const fetchData = useCallback(async () => {
    console.log("🔄 fetchData called")
    setIsLoading(true)
    try {
      const res = await peminjamanService.getByUser(1, 100)
      console.log("📦 Full Response:", res)
      console.log("📦 Response.data:", res?.data)
      
      // Handle berbagai struktur response
      let dataArray: Peminjaman[] = []
      
      if (res?.data && Array.isArray(res.data)) {
        dataArray = res.data
      } else if (Array.isArray(res)) {
        dataArray = res
      } else {
        console.error("❌ Unexpected response structure:", res)
        toast.error("Format data tidak sesuai")
        return
      }
      
      console.log("📋 Data Array:", dataArray)
      console.log("📋 Data Length:", dataArray.length)
      
      const filtered = dataArray.filter((p) => {
        console.log(`🔍 Item ${p.id}: status = ${p.status}`)
        // Filter hanya yang statusnya "dipinjam" (sudah diambil tapi belum dikembalikan)
        return p.status === "dipinjam"
      })
      
      console.log("✅ Filtered Data:", filtered)
      console.log("✅ Filtered Length:", filtered.length)
      
      setApprovedPeminjaman(filtered)
      
      if (filtered.length === 0) {
        console.warn("⚠️ No approved peminjaman found")
      }
    } catch (error: any) {
      console.error("❌ fetchData error:", error)
      console.error("❌ Error response:", error?.response)
      toast.error("Gagal memuat data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log("🚀 Component mounted, calling fetchData")
    fetchData()
  }, [fetchData])

  const filteredAndSortedData = useMemo(() => {
    let result = [...approvedPeminjaman]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const alatName = item.alat?.nama_alat?.toLowerCase() || ""
        const alatKode = item.alat?.kode_alat?.toLowerCase() || ""
        const kodePeminjaman = item.kode_peminjaman?.toLowerCase() || ""
        
        return (
          alatName.includes(query) ||
          alatKode.includes(query) ||
          kodePeminjaman.includes(query)
        )
      })
    }

    if (statusFilter !== "all") {
      result = result.filter((item) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const dueDate = new Date(item.tanggal_kembali_rencana)
        dueDate.setHours(0, 0, 0, 0)
        
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (statusFilter === "terlambat") {
          return today > dueDate
        } else if (statusFilter === "tepat_waktu") {
          return diffDays > 3
        } else if (statusFilter === "mendekati_deadline") {
          return diffDays >= 0 && diffDays <= 3
        }
        return true
      })
    }

    result.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "tanggal_kembali_rencana":
          const dateA = a.tanggal_kembali_rencana ? new Date(a.tanggal_kembali_rencana).getTime() : 0
          const dateB = b.tanggal_kembali_rencana ? new Date(b.tanggal_kembali_rencana).getTime() : 0
          compareValue = dateA - dateB
          break
        case "alat":
          compareValue = (a.alat?.nama_alat || "").localeCompare(b.alat?.nama_alat || "")
          break
        case "jumlah_pinjam":
          compareValue = (a.jumlah_pinjam || 0) - (b.jumlah_pinjam || 0)
          break
        case "keterlambatan":
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const getDaysLate = (date?: string) => {
            if (!date) return 0
            const dueDate = new Date(date)
            dueDate.setHours(0, 0, 0, 0)
            const diffTime = today.getTime() - dueDate.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays > 0 ? diffDays : 0
          }
          compareValue = getDaysLate(a.tanggal_kembali_rencana) - getDaysLate(b.tanggal_kembali_rencana)
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [approvedPeminjaman, searchQuery, statusFilter, sortField, sortOrder])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status)
    setIsStatusFilterOpen(false)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setIsSortOpen(false)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setSortField("tanggal_kembali_rencana")
    setSortOrder("asc")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all"

  const openReturnModal = (peminjaman: Peminjaman) => {
    console.log("📂 Opening modal for peminjaman:", peminjaman)
    
    if (!peminjaman || !peminjaman.id) {
      console.error("❌ Invalid peminjaman data:", peminjaman)
      toast.error("Data peminjaman tidak valid")
      return
    }
    
    setSelectedPeminjaman(peminjaman)
    reset({
      peminjaman_id: peminjaman.id,
      kondisi_alat: "",
      catatan: "",
    })
    
    // Calculate denda for this peminjaman
    if (peminjaman.tanggal_kembali_rencana) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const dueDate = new Date(peminjaman.tanggal_kembali_rencana)
      dueDate.setHours(0, 0, 0, 0)
      
      const diffTime = today.getTime() - dueDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      const keterlambatan = diffDays > 0 ? diffDays : 0
      const dendaKeterlambatan = keterlambatan * 10000
      
      setEstimatedDenda(dendaKeterlambatan)
      console.log("💰 Estimated denda:", dendaKeterlambatan)
    }
    
    setIsModalOpen(true)
    console.log("✅ Modal opened successfully")
  }

  const generateBuktiPengembalian = (peminjaman: Peminjaman, pengembalianData: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const formatDate = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount)
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Pengembalian - ${peminjaman.kode_peminjaman}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px 30px; }
          .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 50px; height: 50px; background: white; border-radius: 50%; padding: 5px; }
          .school-info h1 { font-size: 16px; font-weight: 700; }
          .school-info p { font-size: 9px; opacity: 0.95; margin-top: 2px; }
          .doc-title { text-align: right; }
          .doc-title h2 { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
          .doc-title .subtitle { font-size: 10px; margin-top: 3px; opacity: 0.9; }
          .transaction-code { background: rgba(255,255,255,0.15); padding: 8px 15px; border-radius: 6px; display: inline-block; font-size: 11px; font-weight: 600; }
          .info-card { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 30px; }
          .info-row { display: flex; padding: 5px 0; font-size: 11px; }
          .info-label { width: 180px; color: #64748b; font-weight: 500; }
          .info-value { flex: 1; color: #1e293b; font-weight: 600; }
          .transaction-table { margin: 20px 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .table-header { background: #f1f5f9; padding: 12px 20px; border-bottom: 2px solid #cbd5e1; }
          .table-header h3 { font-size: 12px; color: #334155; font-weight: 600; }
          .table-row { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
          .row-label { font-size: 11px; color: #64748b; }
          .row-value { font-size: 11px; color: #1e293b; font-weight: 600; }
          .denda-section { margin: 20px 30px; background: ${estimatedDenda > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${estimatedDenda > 0 ? '#fca5a5' : '#86efac'}; border-radius: 8px; padding: 15px 20px; }
          .denda-section h4 { font-size: 11px; color: ${estimatedDenda > 0 ? '#991b1b' : '#065f46'}; margin-bottom: 10px; font-weight: 600; }
          .denda-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 11px; }
          .denda-total { font-size: 14px; font-weight: 700; color: ${estimatedDenda > 0 ? '#dc2626' : '#059669'}; }
          .footer { margin: 30px 30px 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
          .signature-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .signature-box { text-align: center; width: 45%; }
          .signature-box .label { font-size: 10px; color: #64748b; margin-bottom: 50px; }
          .signature-box .name { font-size: 11px; font-weight: 600; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 8px; display: inline-block; min-width: 150px; }
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-top">
              <div class="logo-section">
                <div class="logo">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6kzLcr50r0Qn2c5fd-EGmuyRXAikP9Q5mGg&s" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="school-info">
                  <h1>SMK NEGERI 1 JENANGAN</h1>
                  <p>Laboratorium Alat & Bahan</p>
                  <p>Jl. Niken Gandini No.98, Ponorogo 63492 | (0352) 481236</p>
                </div>
              </div>
              <div class="doc-title">
                <h2>BUKTI PENGEMBALIAN</h2>
                <p class="subtitle">Invoice Pengembalian Alat</p>
              </div>
            </div>
            <div class="transaction-code">
              Ref. Peminjaman: ${peminjaman.kode_peminjaman}
            </div>
          </div>
          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Tanggal Pengembalian</div>
              <div class="info-value">${formatDate(new Date().toISOString())}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Peminjam</div>
              <div class="info-value">${user?.nama_lengkap || '-'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kondisi Alat</div>
              <div class="info-value">${pengembalianData.kondisi_alat}</div>
            </div>
          </div>
          <div class="transaction-table">
            <div class="table-header">
              <h3>DETAIL PENGEMBALIAN</h3>
            </div>
            <div class="table-row">
              <span class="row-label">Nama Alat</span>
              <span class="row-value">${peminjaman.alat?.nama_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Dikembalikan</span>
              <span class="row-value">${peminjaman.jumlah_pinjam} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Tanggal Pinjam</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_pinjam)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Batas Kembali</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_kembali_rencana)}</span>
            </div>
          </div>
          <div class="denda-section">
            <h4>💰 ESTIMASI DENDA</h4>
            <div class="denda-row">
              <span>Denda Keterlambatan</span>
              <span>${formatCurrency(estimatedDenda)}</span>
            </div>
            ${pengembalianData.kondisi_alat.toLowerCase() !== 'baik' ? `
              <div class="denda-row">
                <span>Denda Kerusakan</span>
                <span>Ditentukan Petugas</span>
              </div>
            ` : ''}
            <div class="denda-row" style="border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 10px;">
              <span style="font-weight: 700;">TOTAL ESTIMASI</span>
              <span class="denda-total">${formatCurrency(estimatedDenda)}</span>
            </div>
          </div>
          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="label">Peminjam</div>
                <div class="name">${user?.nama_lengkap || '-'}</div>
              </div>
              <div class="signature-box">
                <div class="label">Petugas</div>
                <div class="name">________________</div>
              </div>
            </div>
          </div>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Cetak PDF
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const onSubmit = async (data: PengembalianFormData) => {
    if (!user?.id || !selectedPeminjaman) {
      toast.error("Data tidak valid")
      return
    }

    if (!data.kondisi_alat?.trim()) {
      toast.error("Kondisi alat harus dipilih")
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        peminjaman_id: Number(selectedPeminjaman.id),
        kondisi_alat: data.kondisi_alat.trim().toLowerCase(),
      }

      if (data.catatan && data.catatan.trim() !== "") {
        payload.catatan = data.catatan.trim()
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"

      const response = await axios.post(`${baseURL}/pengembalian`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      toast.success("Pengembalian berhasil dicatat!")
      
      generateBuktiPengembalian(selectedPeminjaman, data)
      
      setIsModalOpen(false)
      reset()
      setSelectedPeminjaman(null)
      
      setTimeout(() => {
        fetchData()
      }, 500)
      
    } catch (error: any) {
      console.error("❌ Error:", error)
      
      if (error?.response?.status === 401) {
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (error?.response?.status === 400) {
        const errorData = error.response.data
        let errorMsg = "Validasi gagal"
        
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = errorData.errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(", ")
          errorMsg = fieldErrors || errorData.message || errorMsg
        } else if (errorData?.message) {
          errorMsg = errorData.message
        }
        
        toast.error(errorMsg)
      } else {
        const errorMsg = error?.response?.data?.message || error?.message || "Gagal melakukan pengembalian"
        toast.error(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case "terlambat": return "Terlambat"
      case "tepat_waktu": return "Aman"
      case "mendekati_deadline": return "Mendekati Deadline"
      default: return "Status"
    }
  }

  const getSortLabel = () => {
    const labels: Record<SortField, string> = {
      tanggal_kembali_rencana: "Deadline",
      alat: "Alat",
      jumlah_pinjam: "Jumlah",
      keterlambatan: "Keterlambatan"
    }
    return labels[sortField]
  }

  const getDaysRemaining = (tanggalKembali?: string) => {
    if (!tanggalKembali) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dueDate = new Date(tanggalKembali)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive border border-destructive/30">
          <AlertTriangle className="h-3 w-3" />
          Terlambat {Math.abs(daysRemaining)} hari
        </span>
      )
    } else if (daysRemaining <= 3) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-500/30">
          <AlertTriangle className="h-3 w-3" />
          {daysRemaining} hari lagi
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary border border-primary/30">
          <Calendar className="h-3 w-3" />
          {daysRemaining} hari lagi
        </span>
      )
    }
  }

  return (
    <>
      <Header
        title="Pengembalian Alat"
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari nama alat, kode alat..."
      />

      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <button
                onClick={() => {
                  setIsStatusFilterOpen(!isStatusFilterOpen)
                  setIsSortOpen(false)
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  statusFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                {getStatusFilterLabel()}
                {statusFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>

              {isStatusFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsStatusFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleStatusFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => handleStatusFilter("terlambat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "terlambat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      🔴 Terlambat
                    </button>
                    <button
                      onClick={() => handleStatusFilter("mendekati_deadline")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "mendekati_deadline" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      ⚠️ Mendekati Deadline (≤3 hari)
                    </button>
                    <button
                      onClick={() => handleStatusFilter("tepat_waktu")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "tepat_waktu" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      ✅ Aman ({">"}3 hari)
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setIsSortOpen(!isSortOpen)
                  setIsStatusFilterOpen(false)
                }}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-input/30 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-border"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort By: {getSortLabel()}
                <ChevronDown className="h-4 w-4" />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleSort("tanggal_kembali_rencana")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "tanggal_kembali_rencana" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      📅 Deadline {sortField === "tanggal_kembali_rencana" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("keterlambatan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "keterlambatan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      ⏱ Keterlambatan {sortField === "keterlambatan" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("alat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "alat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      🔧 Alat {sortField === "alat" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("jumlah_pinjam")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "jumlah_pinjam" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      📦 Jumlah {sortField === "jumlah_pinjam" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-input/30 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              {hasActiveFilters ? "Tidak ada hasil" : "Belum ada peminjaman"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Coba ubah filter atau pencarian Anda"
                : "Peminjaman yang disetujui akan muncul di sini"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedData.map((item, index) => {
              const daysRemaining = getDaysRemaining(item.tanggal_kembali_rencana)
              
              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(daysRemaining)}
                  </div>

                  <div className="relative mt-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-accent glow-accent">
                      <Package className="h-6 w-6 text-primary-foreground" />
                    </div>

                    <h3 className="mb-1 text-lg font-bold text-card-foreground">{item.alat?.nama_alat}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">Jumlah: {item.jumlah_pinjam}</p>

                    <div className="mb-5 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Tgl Pinjam:{" "}
                        <span className="text-card-foreground">
                          {item.tanggal_pinjam
                            ? new Date(item.tanggal_pinjam).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Batas Kembali:{" "}
                        <span className={daysRemaining < 0 ? "text-red-600 font-semibold" : "text-card-foreground"}>
                          {item.tanggal_kembali_rencana
                            ? new Date(item.tanggal_kembali_rencana).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </p>
                      {daysRemaining < 0 && (
                        <p className="flex items-center gap-2 text-red-600 font-semibold text-xs">
                          💸 Estimasi Denda: {formatCurrency(Math.abs(daysRemaining) * 10000)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => openReturnModal(item)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-accent py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-accent/25 glow-accent"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Kembalikan
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          reset()
          setSelectedPeminjaman(null)
        }}
        title="Form Pengembalian Alat"
      >
        {selectedPeminjaman && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedPeminjaman?.alat?.nama_alat}</p>
                  <p className="text-xs text-muted-foreground">Jumlah Dipinjam: {selectedPeminjaman?.jumlah_pinjam}</p>
                </div>
              </div>
            </div>

            {estimatedDenda > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Peringatan Denda</p>
                    <p className="text-xs text-red-700 mt-1">
                      Estimasi denda keterlambatan: <strong>{formatCurrency(estimatedDenda)}</strong>
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Rp 10.000 per hari keterlambatan
                    </p>
                  </div>
                </div>
              </div>
            )}

            <input type="hidden" {...register("peminjaman_id", { valueAsNumber: true })} />

            <div>
              <label className="text-sm font-medium text-card-foreground">
                Kondisi Alat <span className="text-destructive">*</span>
              </label>
              <select
                {...register("kondisi_alat", { required: "Kondisi alat harus dipilih" })}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              >
                <option value="">Pilih Kondisi</option>
                <option value="baik">Baik</option>
                <option value="rusak ringan">Rusak Ringan</option>
                <option value="rusak berat">Rusak Berat</option>
              </select>
              {errors.kondisi_alat && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.kondisi_alat.message}</p>
              )}
              {kondisiAlat && kondisiAlat !== 'baik' && (
                <div className="mt-2 rounded-lg bg-orange-50 border border-orange-200 p-3">
                  <p className="text-xs text-orange-700 font-medium">
                    ⚠️ Denda kerusakan akan ditentukan oleh petugas berdasarkan tingkat kerusakan
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Pastikan kondisi yang dilaporkan sesuai dengan kondisi sebenarnya. Jika berbeda saat pengecekan offline, denda akan disesuaikan.
                  </p>
                </div>
              )}
              <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-700">
                  💡 <strong>Penting:</strong> Petugas akan melakukan pengecekan ulang kondisi alat secara offline. Jika kondisi yang Anda laporkan tidak sesuai dengan hasil pengecekan, akan dikenakan denda tambahan sesuai tingkat kerusakan yang sebenarnya.
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">Catatan (opsional)</label>
              <textarea
                {...register("catatan")}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                placeholder="Tambahkan catatan jika diperlukan..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedPeminjaman(null)
                  reset()
                }}
                disabled={isSubmitting}
                className="rounded-2xl border border-border/50 px-5 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl gradient-accent px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-50 glow-accent"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Memproses..." : "Kembalikan"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}