"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import toast from "react-hot-toast"
import { Printer, Filter, ChevronDown, X, Search as SearchIcon } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { pengembalianService } from "@/lib/services/pengembalian-service"
import type { Pengembalian } from "@/lib/types"

type StatusFilter = "all" | "tepat_waktu" | "terlambat" | "ada_denda"
type KondisiFilter = "all" | "baik" | "rusak_ringan" | "rusak_berat"
type SortField = "tanggal_kembali_aktual" | "peminjam" | "alat" | "denda" | "keterlambatan"
type SortOrder = "asc" | "desc"

export default function PetugasPengembalianPage() {
  const [pengembalianList, setPengembalianList] = useState<Pengembalian[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter & Sort states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [kondisiFilter, setKondisiFilter] = useState<KondisiFilter>("all")
  const [sortField, setSortField] = useState<SortField>("tanggal_kembali_aktual")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false)
  const [isKondisiFilterOpen, setIsKondisiFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

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

  /* ================= SEARCH, FILTER & SORT LOGIC ================= */
  const filteredAndSortedData = useMemo(() => {
    let result = [...pengembalianList]

    // 1. SEARCH
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const peminjamName = item.peminjaman?.peminjam?.nama_lengkap?.toLowerCase() || ""
        const peminjamEmail = item.peminjaman?.peminjam?.email?.toLowerCase() || ""
        const alatName = item.peminjaman?.alat?.nama_alat?.toLowerCase() || ""
        const alatKode = item.peminjaman?.alat?.kode_alat?.toLowerCase() || ""
        const kondisi = item.kondisi_alat?.toLowerCase() || ""
        const catatan = item.catatan?.toLowerCase() || ""
        const id = item.id?.toString() || ""
        
        return (
          id.includes(query) ||
          peminjamName.includes(query) ||
          peminjamEmail.includes(query) ||
          alatName.includes(query) ||
          alatKode.includes(query) ||
          kondisi.includes(query) ||
          catatan.includes(query)
        )
      })
    }

    // 2. FILTER by status
    if (statusFilter !== "all") {
      if (statusFilter === "tepat_waktu") {
        result = result.filter((item) => (item.keterlambatan_hari || 0) === 0)
      } else if (statusFilter === "terlambat") {
        result = result.filter((item) => (item.keterlambatan_hari || 0) > 0)
      } else if (statusFilter === "ada_denda") {
        result = result.filter((item) => (item.denda || 0) > 0)
      }
    }

    // 3. FILTER by kondisi alat
    if (kondisiFilter !== "all") {
      if (kondisiFilter === "baik") {
        result = result.filter((item) => item.kondisi_alat?.toLowerCase() === "baik")
      } else if (kondisiFilter === "rusak_ringan") {
        result = result.filter((item) => item.kondisi_alat?.toLowerCase() === "rusak ringan")
      } else if (kondisiFilter === "rusak_berat") {
        result = result.filter((item) => item.kondisi_alat?.toLowerCase() === "rusak berat")
      }
    }

    // 4. SORT
    result.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "tanggal_kembali_aktual":
          const dateA = a.tanggal_kembali_aktual ? new Date(a.tanggal_kembali_aktual).getTime() : 0
          const dateB = b.tanggal_kembali_aktual ? new Date(b.tanggal_kembali_aktual).getTime() : 0
          compareValue = dateA - dateB
          break
        case "peminjam":
          compareValue = (a.peminjaman?.peminjam?.nama_lengkap || "").localeCompare(
            b.peminjaman?.peminjam?.nama_lengkap || ""
          )
          break
        case "alat":
          compareValue = (a.peminjaman?.alat?.nama_alat || "").localeCompare(
            b.peminjaman?.alat?.nama_alat || ""
          )
          break
        case "denda":
          compareValue = (a.denda || 0) - (b.denda || 0)
          break
        case "keterlambatan":
          compareValue = (a.keterlambatan_hari || 0) - (b.keterlambatan_hari || 0)
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [pengembalianList, searchQuery, statusFilter, kondisiFilter, sortField, sortOrder])

  /* ================= HANDLERS ================= */
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status)
    setIsStatusFilterOpen(false)
    setPage(1)
  }

  const handleKondisiFilter = (kondisi: KondisiFilter) => {
    setKondisiFilter(kondisi)
    setIsKondisiFilterOpen(false)
    setPage(1)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
    setIsSortOpen(false)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setKondisiFilter("all")
    setSortField("tanggal_kembali_aktual")
    setSortOrder("desc")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || kondisiFilter !== "all"

  const generateBuktiPengembalian = (pengembalian: Pengembalian) => {
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

    const formatTime = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    }

    const formatCurrency = (amount?: number) => {
      if (!amount) return 'Rp 0'
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
        <title>Bukti Pengembalian - ${pengembalian.id}</title>
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
          .table-row { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .table-row:last-child { border-bottom: none; }
          .row-label { font-size: 11px; color: #64748b; }
          .row-value { font-size: 11px; color: #1e293b; font-weight: 600; }
          .row-main { font-size: 13px; font-weight: 700; color: #1e293b; }
          
          .denda-section { margin: 20px 30px; background: ${pengembalian.denda && pengembalian.denda > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${pengembalian.denda && pengembalian.denda > 0 ? '#fca5a5' : '#86efac'}; border-radius: 8px; padding: 15px 20px; }
          .denda-section h4 { font-size: 11px; color: ${pengembalian.denda && pengembalian.denda > 0 ? '#991b1b' : '#065f46'}; margin-bottom: 10px; font-weight: 600; }
          .denda-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 11px; border-bottom: 1px solid ${pengembalian.denda && pengembalian.denda > 0 ? '#fee2e2' : '#d1fae5'}; }
          .denda-row:last-child { border-bottom: none; }
          .denda-total { font-size: 14px; font-weight: 700; color: ${pengembalian.denda && pengembalian.denda > 0 ? '#dc2626' : '#059669'}; }
          
          .kondisi-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
          .kondisi-baik { background: #d1fae5; color: #065f46; }
          .kondisi-rusak { background: #fee2e2; color: #991b1b; }
          
          .footer { margin: 30px 30px 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
          .signature-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .signature-box { text-align: center; width: 45%; }
          .signature-box .label { font-size: 10px; color: #64748b; margin-bottom: 50px; }
          .signature-box .name { font-size: 11px; font-weight: 600; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 8px; display: inline-block; min-width: 150px; }
          .signature-box .role { font-size: 9px; color: #64748b; margin-top: 3px; }
          
          .footer-note { text-align: center; padding: 15px; background: #f8fafc; border-radius: 6px; }
          .footer-note p { font-size: 9px; color: #64748b; line-height: 1.6; }
          .footer-note .timestamp { font-weight: 600; color: #1e293b; margin-top: 5px; }
          
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none; }
            @page { margin: 1cm; }
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
              No. Transaksi: RETURN-${pengembalian.id.toString().padStart(6, '0')}
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Tanggal Pengembalian</div>
              <div class="info-value">${formatDate(pengembalian.tanggal_kembali_aktual)} ${formatTime(pengembalian.tanggal_kembali_aktual)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Peminjam</div>
              <div class="info-value">${pengembalian.peminjaman?.peminjam?.nama_lengkap || '-'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kategori</div>
              <div class="info-value">Pengembalian Alat Laboratorium</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kondisi Alat</div>
              <div class="info-value">
                <span class="kondisi-badge ${pengembalian.kondisi_alat?.toLowerCase() === 'baik' ? 'kondisi-baik' : 'kondisi-rusak'}">
                  ${pengembalian.kondisi_alat || '-'}
                </span>
              </div>
            </div>
          </div>

          <div class="transaction-table">
            <div class="table-header">
              <h3>DETAIL TRANSAKSI PENGEMBALIAN</h3>
            </div>
            <div class="table-row">
              <span class="row-label">Kode Alat</span>
              <span class="row-value">${pengembalian.peminjaman?.alat?.kode_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Nama Alat</span>
              <span class="row-main">${pengembalian.peminjaman?.alat?.nama_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Dipinjam</span>
              <span class="row-value">${pengembalian.peminjaman?.jumlah_pinjam || 0} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Dikembalikan</span>
              <span class="row-main">${pengembalian.jumlah_dikembalikan || 0} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Tanggal Pinjam</span>
              <span class="row-value">${formatDate(pengembalian.peminjaman?.tanggal_pinjam)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Batas Kembali</span>
              <span class="row-value">${formatDate(pengembalian.peminjaman?.tanggal_kembali_rencana)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Keterlambatan</span>
              <span class="row-value">${pengembalian.keterlambatan_hari || 0} Hari</span>
            </div>
          </div>

          <div class="denda-section">
            <h4>💰 RINCIAN DENDA & BIAYA</h4>
            <div class="denda-row">
              <span>Denda Keterlambatan (${pengembalian.keterlambatan_hari || 0} hari × Rp 10.000)</span>
              <span>${formatCurrency((pengembalian.keterlambatan_hari || 0) * 10000)}</span>
            </div>
            <div class="denda-row">
              <span>Denda Kerusakan Alat</span>
              <span>${pengembalian.kondisi_alat?.toLowerCase() !== 'baik' ? 'Ditentukan Petugas' : 'Rp 0'}</span>
            </div>
            <div class="denda-row" style="border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 10px;">
              <span style="font-weight: 700;">TOTAL DENDA</span>
              <span class="denda-total">${formatCurrency(pengembalian.denda || 0)}</span>
            </div>
            ${pengembalian.kondisi_alat?.toLowerCase() !== 'baik' ? `
              <div style="margin-top: 10px; padding: 10px; background: #fff7ed; border-radius: 6px; font-size: 10px; color: #9a3412;">
                ⚠️ <strong>Catatan:</strong> Denda kerusakan alat akan ditentukan oleh petugas berdasarkan tingkat kerusakan
              </div>
            ` : ''}
          </div>

          ${pengembalian.catatan ? `
          <div style="margin: 20px 30px; background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px 20px;">
            <h4 style="font-size: 11px; color: #854d0e; margin-bottom: 8px; font-weight: 600;">📝 Catatan</h4>
            <p style="font-size: 10px; color: #713f12; line-height: 1.5;">${pengembalian.catatan}</p>
          </div>
          ` : ''}

          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="label">Peminjam</div>
                <div class="name">${pengembalian.peminjaman?.peminjam?.nama_lengkap || '-'}</div>
                <div class="role">Siswa/Guru</div>
              </div>
              <div class="signature-box">
                <div class="label">Petugas Laboratorium</div>
                <div class="name">________________</div>
                <div class="role">Kepala Laboratorium</div>
              </div>
            </div>
            
            <div class="footer-note">
              <p><strong>Terima Kasih</strong></p>
              <p>Dokumen ini dicetak secara otomatis dari Sistem Peminjaman Lab SMK Negeri 1 Jenangan</p>
              <p class="timestamp">Dicetak: ${new Date().toLocaleString('id-ID', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</p>
            </div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px;">
            Cetak PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Tutup
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const getKondisiBadge = (kondisi?: string) => {
    if (!kondisi) return <span className="text-xs text-muted-foreground">-</span>
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case "tepat_waktu": return "Tepat Waktu"
      case "terlambat": return "Terlambat"
      case "ada_denda": return "Ada Denda"
      default: return "Status"
    }
  }

  const getKondisiFilterLabel = () => {
    switch (kondisiFilter) {
      case "baik": return "Baik"
      case "rusak_ringan": return "Rusak Ringan"
      case "rusak_berat": return "Rusak Berat"
      default: return "Kondisi"
    }
  }

  const getSortLabel = () => {
    const labels: Record<SortField, string> = {
      tanggal_kembali_aktual: "Tanggal",
      peminjam: "Peminjam",
      alat: "Alat",
      denda: "Denda",
      keterlambatan: "Keterlambatan"
    }
    return labels[sortField]
  }

  const columns = [
    { key: "id", label: "ID" },
    { 
      key: "peminjam", 
      label: "Peminjam",
      render: (p: Pengembalian) => (
        <div>
          <p className="font-medium text-foreground">{p.peminjaman?.peminjam?.nama_lengkap || "-"}</p>
          <p className="text-xs text-muted-foreground">{p.peminjaman?.peminjam?.email || ""}</p>
        </div>
      )
    },
    {
      key: "alat",
      label: "Alat",
      render: (p: Pengembalian) => (
        <div>
          <p className="font-medium text-foreground">{p.peminjaman?.alat?.nama_alat || "-"}</p>
          <p className="text-xs text-muted-foreground">{p.peminjaman?.alat?.kode_alat || ""}</p>
        </div>
      )
    },
    {
      key: "jumlah",
      label: "Jumlah",
      render: (p: Pengembalian) => <span className="font-semibold">{p.jumlah_dikembalikan || 0} Unit</span>
    },
    {
      key: "tanggal_kembali_aktual",
      label: "Tgl Kembali",
      render: (p: Pengembalian) => {
        if (!p.tanggal_kembali_aktual) return "-"
        const date = new Date(p.tanggal_kembali_aktual)
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{date.toLocaleDateString("id-ID")}</p>
            <p className="text-muted-foreground">{date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        )
      },
    },
    { 
      key: "keterlambatan",
      label: "Terlambat",
      render: (p: Pengembalian) => {
        const days = p.keterlambatan_hari || 0
        return (
          <span className={`text-xs font-semibold ${days > 0 ? "text-red-600" : "text-green-600"}`}>
            {days} hari
          </span>
        )
      }
    },
    { 
      key: "kondisi_alat", 
      label: "Kondisi", 
      render: (p: Pengembalian) => getKondisiBadge(p.kondisi_alat) 
    },
    {
      key: "denda",
      label: "Denda",
      render: (p: Pengembalian) => {
        const amount = p.denda || 0
        return (
          <span className={`text-xs font-semibold ${amount > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(amount)}
          </span>
        )
      }
    },
    {
      key: "actions",
      label: "Aksi",
      render: (p: Pengembalian) => (
        <button
          onClick={() => generateBuktiPengembalian(p)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Cetak
        </button>
      )
    },
  ]

  return (
    <>
      <Header
        title="Monitor Pengembalian"
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari peminjam, alat, kondisi..."
      />

      <div className="p-6 space-y-6">
        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter !== "all"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                <Filter className="h-4 w-4" />
                {getStatusFilterLabel()}
                <ChevronDown className={`h-4 w-4 transition-transform ${isStatusFilterOpen ? "rotate-180" : ""}`} />
              </button>

              {isStatusFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsStatusFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-48 rounded-lg border border-border bg-background shadow-lg">
                    <div className="p-1">
                      <button
                        onClick={() => handleStatusFilter("all")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "all" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        Semua Status
                      </button>
                      <button
                        onClick={() => handleStatusFilter("tepat_waktu")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "tepat_waktu" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ✓ Tepat Waktu
                      </button>
                      <button
                        onClick={() => handleStatusFilter("terlambat")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "terlambat" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ⚠ Terlambat
                      </button>
                      <button
                        onClick={() => handleStatusFilter("ada_denda")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "ada_denda" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        💰 Ada Denda
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Kondisi Filter */}
            <div className="relative">
              <button
                onClick={() => setIsKondisiFilterOpen(!isKondisiFilterOpen)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  kondisiFilter !== "all"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                <Filter className="h-4 w-4" />
                {getKondisiFilterLabel()}
                <ChevronDown className={`h-4 w-4 transition-transform ${isKondisiFilterOpen ? "rotate-180" : ""}`} />
              </button>

              {isKondisiFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsKondisiFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-48 rounded-lg border border-border bg-background shadow-lg">
                    <div className="p-1">
                      <button
                        onClick={() => handleKondisiFilter("all")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          kondisiFilter === "all" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        Semua Kondisi
                      </button>
                      <button
                        onClick={() => handleKondisiFilter("baik")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          kondisiFilter === "baik" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ✓ Baik
                      </button>
                      <button
                        onClick={() => handleKondisiFilter("rusak_ringan")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          kondisiFilter === "rusak_ringan" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ⚠ Rusak Ringan
                      </button>
                      <button
                        onClick={() => handleKondisiFilter("rusak_berat")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          kondisiFilter === "rusak_berat" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ❌ Rusak Berat
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sort By Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Sort By: {getSortLabel()}
                <ChevronDown className={`h-4 w-4 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-lg border border-border bg-background shadow-lg">
                    <div className="p-1">
                      <button
                        onClick={() => handleSort("tanggal_kembali_aktual")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "tanggal_kembali_aktual" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        📅 Tanggal Kembali {sortField === "tanggal_kembali_aktual" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => handleSort("peminjam")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "peminjam" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        👤 Peminjam {sortField === "peminjam" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => handleSort("alat")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "alat" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        🔧 Alat {sortField === "alat" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => handleSort("denda")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "denda" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        💰 Denda {sortField === "denda" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => handleSort("keterlambatan")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "keterlambatan" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ⏱ Keterlambatan {sortField === "keterlambatan" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>

          {/* Results Info */}
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{filteredAndSortedData.length}</span> dari{" "}
            <span className="font-semibold text-foreground">{pengembalianList.length}</span> pengembalian
          </div>
        </div>

        {/* Search Result Info */}
        {searchQuery && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              Hasil pencarian untuk <span className="font-semibold text-primary">"{searchQuery}"</span>
              {filteredAndSortedData.length === 0 && " - Tidak ada hasil ditemukan"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {(searchQuery || hasActiveFilters) && filteredAndSortedData.length === 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Tidak Ada Hasil</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tidak ditemukan pengembalian yang sesuai dengan filter yang dipilih
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Data Table */}
        {(!searchQuery && !hasActiveFilters) || filteredAndSortedData.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredAndSortedData}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </>
  )
}