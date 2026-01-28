"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import toast from "react-hot-toast"
import { Filter, ChevronDown, X, Search as SearchIcon, AlertCircle } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { RejectDetailModal } from "@/components/dashboard/reject-detail-modal"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { useAuthStore } from "@/store/auth-store"
import type { Peminjaman } from "@/lib/types"

type StatusFilter = "all" | "diajukan" | "disetujui" | "ditolak" | "dipinjam" | "dikembalikan"
type SortField = "tanggal_pengajuan" | "tanggal_pinjam" | "alat" | "jumlah_pinjam" | "status"
type SortOrder = "asc" | "desc"

export default function PeminjamPeminjamanPage() {
  const { user } = useAuthStore()
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter & Sort states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortField, setSortField] = useState<SortField>("tanggal_pengajuan")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  
  // Reject Detail Modal State
  const [isRejectDetailOpen, setIsRejectDetailOpen] = useState(false)
  const [selectedRejection, setSelectedRejection] = useState<Peminjaman | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await peminjamanService.getByUser(page)
      console.log("✅ Data peminjaman dari backend:", res.data)
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

  /* ================= SEARCH, FILTER & SORT LOGIC ================= */
  const filteredAndSortedData = useMemo(() => {
    let result = [...peminjamanList]

    // 1. SEARCH
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const kodePeminjaman = item.kode_peminjaman?.toLowerCase() || ""
        const alatName = item.alat?.nama_alat?.toLowerCase() || ""
        const alatKode = item.alat?.kode_alat?.toLowerCase() || ""
        const keperluan = item.keperluan?.toLowerCase() || ""
        const status = item.status?.toLowerCase() || ""
        
        return (
          kodePeminjaman.includes(query) ||
          alatName.includes(query) ||
          alatKode.includes(query) ||
          keperluan.includes(query) ||
          status.includes(query)
        )
      })
    }

    // 2. FILTER by status
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter)
    }

    // 3. SORT
    result.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "tanggal_pengajuan":
          const dateA = a.tanggal_pengajuan ? new Date(a.tanggal_pengajuan).getTime() : 0
          const dateB = b.tanggal_pengajuan ? new Date(b.tanggal_pengajuan).getTime() : 0
          compareValue = dateA - dateB
          break
        case "tanggal_pinjam":
          const pinjamA = a.tanggal_pinjam ? new Date(a.tanggal_pinjam).getTime() : 0
          const pinjamB = b.tanggal_pinjam ? new Date(b.tanggal_pinjam).getTime() : 0
          compareValue = pinjamA - pinjamB
          break
        case "alat":
          compareValue = (a.alat?.nama_alat || "").localeCompare(b.alat?.nama_alat || "")
          break
        case "jumlah_pinjam":
          compareValue = (a.jumlah_pinjam || 0) - (b.jumlah_pinjam || 0)
          break
        case "status":
          const statusOrder: Record<string, number> = {
            diajukan: 1,
            disetujui: 2,
            ditolak: 3,
            dipinjam: 4,
            dikembalikan: 5
          }
          compareValue = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [peminjamanList, searchQuery, statusFilter, sortField, sortOrder])

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
    setSortField("tanggal_pengajuan")
    setSortOrder("desc")
  }

  const openRejectDetail = (peminjaman: Peminjaman) => {
    console.log("🔍 Data peminjaman yang ditolak:", peminjaman)
    console.log("📝 Catatan persetujuan/penolakan:", peminjaman.catatan_persetujuan)
    setSelectedRejection(peminjaman)
    setIsRejectDetailOpen(true)
  }

  const closeRejectDetail = () => {
    setIsRejectDetailOpen(false)
    setSelectedRejection(null)
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all"

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      diajukan: "bg-yellow-500/10 text-yellow-500",
      disetujui: "bg-blue-500/10 text-blue-500",
      ditolak: "bg-red-500/10 text-red-500",
      dipinjam: "bg-green-500/10 text-green-500",
      dikembalikan: "bg-gray-500/10 text-gray-500",
    }
    const labels: Record<string, string> = {
      diajukan: "Diajukan",
      disetujui: "Disetujui",
      ditolak: "Ditolak",
      dipinjam: "Dipinjam",
      dikembalikan: "Dikembalikan",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ""}`}
      >
        {labels[status] || status}
      </span>
    )
  }

  const generatePDF = (peminjaman: Peminjaman) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const statusLabels: Record<string, string> = {
      diajukan: "Diajukan",
      disetujui: "Disetujui",
      ditolak: "Ditolak",
      dipinjam: "Dipinjam",
      dikembalikan: "Dikembalikan",
    }

    const formatDate = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Peminjaman - ${peminjaman.kode_peminjaman}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; margin-bottom: 15px; border-radius: 6px; }
          .header-content { display: flex; justify-content: space-between; align-items: center; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 60px; height: 60px; background: white; border-radius: 50%; padding: 6px; }
          .school-info h1 { font-size: 18px; margin-bottom: 3px; }
          .school-info p { font-size: 10px; opacity: 0.9; line-height: 1.3; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 28px; font-weight: 700; }
          .invoice-title p { font-size: 11px; margin-top: 3px; }
          .info-section { margin: 15px 0; display: flex; justify-content: space-between; }
          .info-box h3 { font-size: 12px; color: #1e3a8a; margin-bottom: 6px; font-weight: 600; }
          .info-box p { font-size: 11px; margin: 3px 0; color: #333; line-height: 1.4; }
          .info-box strong { display: inline-block; width: 110px; }
          .status-box { text-align: right; }
          .status-box .label { font-size: 10px; color: #666; margin-bottom: 5px; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; }
          .status-diajukan { background: #fef3c7; color: #92400e; }
          .status-disetujui { background: #dbeafe; color: #1e40af; }
          .status-ditolak { background: #fee2e2; color: #991b1b; }
          .status-dipinjam { background: #d1fae5; color: #065f46; }
          .status-dikembalikan { background: #e5e7eb; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          thead { background: #1e3a8a; color: white; }
          th { padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 600; }
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tbody tr:hover { background: #f9fafb; }
          .detail-section { margin: 12px 0; padding: 12px; background: #f9fafb; border-radius: 4px; }
          .detail-row { display: flex; margin: 5px 0; }
          .detail-label { width: 160px; font-weight: 600; color: #1e3a8a; font-size: 11px; }
          .detail-value { flex: 1; color: #333; font-size: 11px; }
          .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 220px; }
          .signature-box p { font-size: 11px; margin-bottom: 50px; color: #666; }
          .signature-box .name { font-weight: 600; border-top: 1px solid #333; padding-top: 8px; display: inline-block; min-width: 180px; font-size: 11px; }
          .signature-box .title { font-size: 10px; color: #666; margin-top: 3px; }
          .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #666; line-height: 1.4; }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <div class="logo-section">
              <div class="logo">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6kzLcr50r0Qn2c5fd-EGmuyRXAikP9Q5mGg&s" alt="Logo SMK Negeri 1 Jenangan" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div class="school-info">
                <h1>SMK NEGERI 1 JENANGAN</h1>
                <p>Jl. Niken Gandini No.98, Plampitan, Setono</p>
                <p>Kec. Jenangan, Kab. Ponorogo, Jawa Timur 63492</p>
                <p>Telp: (0352) 481236</p>
              </div>
            </div>
            <div class="invoice-title">
              <h2>BUKTI PEMINJAMAN</h2>
              <p>NO: ${peminjaman.kode_peminjaman}</p>
              <p style="margin-top: 15px;">Tanggal Pengajuan</p>
              <p style="font-weight: 600;">${formatDate(peminjaman.tanggal_pengajuan)}</p>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>PEMINJAM:</h3>
            <p><strong>Nama:</strong> ${peminjaman.peminjam?.nama_lengkap || user?.nama_lengkap || '-'}</p>
            <p><strong>Username:</strong> ${peminjaman.peminjam?.username || user?.username || '-'}</p>
            <p><strong>Email:</strong> ${peminjaman.peminjam?.email || user?.email || '-'}</p>
            <p><strong>No. Telepon:</strong> ${peminjaman.peminjam?.no_telepon || user?.no_telepon || '-'}</p>
          </div>
          <div class="status-box">
            <div class="label">Status Peminjaman</div>
            <span class="status-badge status-${peminjaman.status}">
              ${statusLabels[peminjaman.status] || peminjaman.status}
            </span>
          </div>
        </div>

        <div class="detail-section">
          <h3 style="color: #1e3a8a; margin-bottom: 15px;">Detail Peminjaman</h3>
          <div class="detail-row">
            <div class="detail-label">Keperluan:</div>
            <div class="detail-value">${peminjaman.keperluan || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Pinjam:</div>
            <div class="detail-value">${formatDate(peminjaman.tanggal_pinjam)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Kembali (Rencana):</div>
            <div class="detail-value">${formatDate(peminjaman.tanggal_kembali_rencana)}</div>
          </div>
          ${peminjaman.penyetuju ? `
          <div class="detail-row">
            <div class="detail-label">Disetujui Oleh:</div>
            <div class="detail-value">${peminjaman.penyetuju.nama_lengkap}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Persetujuan:</div>
            <div class="detail-value">${formatDate(peminjaman.tanggal_persetujuan)}</div>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Kode Alat</th>
              <th>Nama Alat</th>
              <th>Kategori</th>
              <th style="text-align: center;">Jumlah Pinjam</th>
              <th>Kondisi</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${peminjaman.alat?.kode_alat || '-'}</strong></td>
              <td>${peminjaman.alat?.nama_alat || '-'}</td>
              <td>${peminjaman.alat?.kategori?.nama_kategori || '-'}</td>
              <td style="text-align: center; font-weight: 600; font-size: 16px;">${peminjaman.jumlah_pinjam}</td>
              <td>${peminjaman.alat?.kondisi || '-'}</td>
              <td>${peminjaman.alat?.lokasi_penyimpanan || '-'}</td>
            </tr>
          </tbody>
        </table>

        ${peminjaman.keperluan || peminjaman.catatan_persetujuan ? `
        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
          ${peminjaman.keperluan ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #1e3a8a;">Keperluan:</strong>
              <p style="margin-top: 5px; font-size: 13px; color: #333;">${peminjaman.keperluan}</p>
            </div>
          ` : ''}
          ${peminjaman.catatan_persetujuan ? `
            <div>
              <strong style="color: #1e3a8a;">Catatan Persetujuan:</strong>
              <p style="margin-top: 5px; font-size: 13px; color: #333;">${peminjaman.catatan_persetujuan}</p>
            </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <p>Peminjam</p>
            <div class="name">${peminjaman.peminjam?.nama_lengkap || user?.nama_lengkap || '-'}</div>
            <div class="title">${peminjaman.peminjam?.role === 'peminjam' ? 'Siswa/Guru' : peminjaman.peminjam?.role || ''}</div>
          </div>
          <div class="signature-box">
            <p>Petugas Laboratorium</p>
            <div class="name">${peminjaman.penyetuju?.nama_lengkap || '_________________'}</div>
            <div class="title">${peminjaman.penyetuju ? 'Kepala Laboratorium' : ''}</div>
          </div>
        </div>

        <div class="footer">
          <p><strong>TERIMA KASIH</strong></p>
          <p style="margin-top: 5px;">Dokumen ini dicetak secara otomatis dari Sistem Peminjaman Alat Lab SMK Negeri 1 Jenangan</p>
          <p style="margin-top: 5px;">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
            Cetak PDF
          </button>
          <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
            Tutup
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case "diajukan": return "Diajukan"
      case "disetujui": return "Disetujui"
      case "ditolak": return "Ditolak"
      case "dipinjam": return "Dipinjam"
      case "dikembalikan": return "Dikembalikan"
      default: return "Status"
    }
  }

  const getSortLabel = () => {
    const labels: Record<SortField, string> = {
      tanggal_pengajuan: "Tgl Pengajuan",
      tanggal_pinjam: "Tgl Pinjam",
      alat: "Alat",
      jumlah_pinjam: "Jumlah",
      status: "Status"
    }
    return labels[sortField]
  }

  const columns = [
    { 
      key: "kode_peminjaman", 
      label: "Kode",
      render: (p: Peminjaman) => (
        <span className="font-mono text-xs font-medium text-foreground">{p.kode_peminjaman}</span>
      )
    },
    { 
      key: "alat", 
      label: "Alat", 
      render: (p: Peminjaman) => (
        <div>
          <div className="font-medium text-foreground">{p.alat?.nama_alat || "-"}</div>
          <div className="text-xs text-muted-foreground">{p.alat?.kode_alat || ""}</div>
        </div>
      )
    },
    { 
      key: "jumlah_pinjam", 
      label: "Jumlah",
      render: (p: Peminjaman) => (
        <span className="font-semibold text-foreground">{p.jumlah_pinjam}</span>
      )
    },
    {
      key: "tanggal_pinjam",
      label: "Tgl Pinjam",
      render: (p: Peminjaman) => {
        if (!p.tanggal_pinjam) return "-"
        const date = new Date(p.tanggal_pinjam)
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{date.toLocaleDateString("id-ID")}</p>
          </div>
        )
      }
    },
    {
      key: "tanggal_kembali",
      label: "Tgl Kembali",
      render: (p: Peminjaman) => {
        if (!p.tanggal_kembali_rencana) return "-"
        const date = new Date(p.tanggal_kembali_rencana)
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{date.toLocaleDateString("id-ID")}</p>
          </div>
        )
      }
    },
    { 
      key: "status", 
      label: "Status", 
      render: (p: Peminjaman) => getStatusBadge(p.status) 
    },
    {
      key: "aksi",
      label: "Aksi",
      render: (p: Peminjaman) => (
        <div className="flex gap-2">
          {/* Lihat Keterangan Penolakan - Tampil untuk semua status ditolak */}
          {p.status === "ditolak" && (
            <button
              onClick={() => openRejectDetail(p)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-red-600 bg-red-500/10 hover:bg-red-500/20"
              title="Lihat alasan penolakan"
            >
              <AlertCircle className="w-4 h-4" />
              Lihat Alasan
            </button>
          )}
          
          {/* Cetak PDF */}
          {p.status === "disetujui" && (
            <button
              onClick={() => generatePDF(p)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-primary bg-primary/10 hover:bg-primary/20"
              title="Cetak bukti peminjaman"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <>
      <Header
        title="Peminjaman Saya"
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari kode peminjaman, alat, keperluan..."
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
                        onClick={() => handleStatusFilter("diajukan")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "diajukan" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        📝 Diajukan
                      </button>
                      <button
                        onClick={() => handleStatusFilter("disetujui")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "disetujui" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ✅ Disetujui
                      </button>
                      <button
                        onClick={() => handleStatusFilter("ditolak")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "ditolak" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ❌ Ditolak
                      </button>
                      <button
                        onClick={() => handleStatusFilter("dipinjam")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "dipinjam" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        📦 Dipinjam
                      </button>
                      <button
                        onClick={() => handleStatusFilter("dikembalikan")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          statusFilter === "dikembalikan" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        ✓ Dikembalikan
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
                        onClick={() => handleSort("tanggal_pengajuan")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "tanggal_pengajuan" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        📅 Tgl Pengajuan {sortField === "tanggal_pengajuan" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => handleSort("tanggal_pinjam")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "tanggal_pinjam" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        📆 Tgl Pinjam {sortField === "tanggal_pinjam" && (sortOrder === "asc" ? "↑" : "↓")}
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
                        onClick={() => handleSort("jumlah_pinjam")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "jumlah_pinjam" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        🔢 Jumlah {sortField === "jumlah_pinjam" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => handleSort("status")}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          sortField === "status" ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
                        }`}
                      >
                        📊 Status {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
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
            <span className="font-semibold text-foreground">{peminjamanList.length}</span> peminjaman
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
              Tidak ditemukan peminjaman yang sesuai dengan filter yang dipilih
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

      {/* Reject Detail Modal */}
      {selectedRejection && (
        <RejectDetailModal
          isOpen={isRejectDetailOpen}
          onClose={closeRejectDetail}
          keterangan={selectedRejection.catatan_persetujuan || "Tidak ada keterangan"}
          peminjaman={{
            kode: selectedRejection.kode_peminjaman || "",
            alat: selectedRejection.alat?.nama_alat || "",
            tanggal: selectedRejection.tanggal_pengajuan 
              ? new Date(selectedRejection.tanggal_pengajuan).toLocaleDateString("id-ID", {
                  day: 'numeric',
                  month: 'long', 
                  year: 'numeric'
                })
              : ""
          }}
        />
      )}
    </>
  )
}