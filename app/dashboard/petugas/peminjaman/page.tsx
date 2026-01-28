"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import toast from "react-hot-toast"
import { CheckCircle, XCircle, Printer, Search as SearchIcon, Filter, ArrowUpDown, X, ChevronDown, Package } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { RejectModal } from "@/components/dashboard/reject-modal"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import type { Peminjaman, StatusPeminjaman } from "@/lib/types"

type StatusFilter = "all" | "diajukan" | "disetujui" | "ditolak" | "dipinjam" | "dikembalikan"
type SortField = "tanggal_pengajuan" | "tanggal_pinjam" | "tanggal_kembali_rencana" | "peminjam" | "alat" | "status" | "jumlah_pinjam"
type SortOrder = "asc" | "desc"

export default function PetugasPeminjamanPage() {
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
  
  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null)
  const [isRejecting, setIsRejecting] = useState(false)
  
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

  /* ================= SEARCH, FILTER & SORT LOGIC ================= */
  const filteredAndSortedData = useMemo(() => {
    let result = [...peminjamanList]

    // 1. SEARCH
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const peminjamName = item.peminjam?.nama_lengkap?.toLowerCase() || ""
        const peminjamEmail = item.peminjam?.email?.toLowerCase() || ""
        const peminjamUsername = item.peminjam?.username?.toLowerCase() || ""
        const alatName = item.alat?.nama_alat?.toLowerCase() || ""
        const alatKode = item.alat?.kode_alat?.toLowerCase() || ""
        const status = item.status?.toLowerCase() || ""
        const keperluan = item.keperluan?.toLowerCase() || ""
        const kodePeminjaman = item.kode_peminjaman?.toLowerCase() || ""
        const id = item.id?.toString() || ""
        
        return (
          id.includes(query) ||
          kodePeminjaman.includes(query) ||
          peminjamName.includes(query) ||
          peminjamEmail.includes(query) ||
          peminjamUsername.includes(query) ||
          alatName.includes(query) ||
          alatKode.includes(query) ||
          status.includes(query) ||
          keperluan.includes(query)
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
          compareValue = new Date(a.tanggal_pengajuan || 0).getTime() - new Date(b.tanggal_pengajuan || 0).getTime()
          break
        case "tanggal_pinjam":
          const datePinjamA = a.tanggal_pinjam ? new Date(a.tanggal_pinjam).getTime() : 0
          const datePinjamB = b.tanggal_pinjam ? new Date(b.tanggal_pinjam).getTime() : 0
          compareValue = datePinjamA - datePinjamB
          break
        case "tanggal_kembali_rencana":
          const dateKembaliA = a.tanggal_kembali_rencana ? new Date(a.tanggal_kembali_rencana).getTime() : 0
          const dateKembaliB = b.tanggal_kembali_rencana ? new Date(b.tanggal_kembali_rencana).getTime() : 0
          compareValue = dateKembaliA - dateKembaliB
          break
        case "peminjam":
          compareValue = (a.peminjam?.nama_lengkap || "").localeCompare(b.peminjam?.nama_lengkap || "")
          break
        case "alat":
          compareValue = (a.alat?.nama_alat || "").localeCompare(b.alat?.nama_alat || "")
          break
        case "status":
          compareValue = (a.status || "").localeCompare(b.status || "")
          break
        case "jumlah_pinjam":
          compareValue = (a.jumlah_pinjam || 0) - (b.jumlah_pinjam || 0)
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [peminjamanList, searchQuery, statusFilter, sortField, sortOrder])

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

  const hasActiveFilters = searchQuery || statusFilter !== "all"

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

  const openRejectModal = (peminjaman: Peminjaman) => {
    setSelectedPeminjaman(peminjaman)
    setIsRejectModalOpen(true)
  }

  const closeRejectModal = () => {
    if (!isRejecting) {
      setIsRejectModalOpen(false)
      setSelectedPeminjaman(null)
    }
  }

  const handleRejectConfirm = async (keterangan: string) => {
    if (!selectedPeminjaman) return
    
    setIsRejecting(true)
    try {
      await peminjamanService.reject(selectedPeminjaman.id, keterangan)
      toast.success("Peminjaman ditolak")
      closeRejectModal()
      fetchData()
    } catch (error) {
      toast.error("Gagal menolak peminjaman")
      console.error(error)
    } finally {
      setIsRejecting(false)
    }
  }

  const handleSetDipinjam = async (id: number) => {
    try {
      await peminjamanService.markAsDipinjam(id)
      toast.success("Status peminjaman diubah ke Dipinjam")
      fetchData()
    } catch (error) {
      toast.error("Gagal mengubah status ke Dipinjam")
      console.error(error)
    }
  }

  const generateBuktiPeminjaman = (peminjaman: Peminjaman) => {
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Peminjaman - ${peminjaman.kode_peminjaman}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px 30px; }
          .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 50px; height: 50px; background: white; border-radius: 50%; padding: 5px; }
          .school-info h1 { font-size: 16px; font-weight: 700; }
          .school-info p { font-size: 9px; opacity: 0.95; margin-top: 2px; }
          .doc-title { text-align: right; }
          .doc-title h2 { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
          .doc-title .subtitle { font-size: 10px; margin-top: 3px; opacity: 0.9; }
          .transaction-code { background: rgba(255,255,255,0.15); padding: 8px 15px; border-radius: 6px; display: inline-block; font-size: 11px; font-weight: 600; }
          
          .info-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 20px 30px; }
          .info-row { display: flex; padding: 5px 0; font-size: 11px; }
          .info-label { width: 180px; color: #64748b; font-weight: 500; }
          .info-value { flex: 1; color: #1e293b; font-weight: 600; }
          
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          .status-diajukan { background: #fef3c7; color: #92400e; }
          .status-disetujui { background: #dbeafe; color: #1e40af; }
          .status-ditolak { background: #fee2e2; color: #991b1b; }
          .status-dipinjam { background: #d1fae5; color: #065f46; }
          .status-dikembalikan { background: #e5e7eb; color: #1f2937; }
          
          .transaction-table { margin: 20px 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .table-header { background: #f1f5f9; padding: 12px 20px; border-bottom: 2px solid #cbd5e1; }
          .table-header h3 { font-size: 12px; color: #334155; font-weight: 600; }
          .table-row { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .table-row:last-child { border-bottom: none; }
          .row-label { font-size: 11px; color: #64748b; }
          .row-value { font-size: 11px; color: #1e293b; font-weight: 600; }
          .row-main { font-size: 13px; font-weight: 700; color: #1e293b; }
          
          .details-section { margin: 20px 30px; background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px 20px; }
          .details-section h4 { font-size: 11px; color: #854d0e; margin-bottom: 10px; font-weight: 600; }
          .details-section p { font-size: 10px; color: #713f12; line-height: 1.5; }
          
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
                <h2>BUKTI PEMINJAMAN</h2>
                <p class="subtitle">Invoice Peminjaman Alat</p>
              </div>
            </div>
            <div class="transaction-code">
              No. Transaksi: ${peminjaman.kode_peminjaman}
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Tanggal Transaksi</div>
              <div class="info-value">${formatDate(peminjaman.tanggal_pengajuan)} ${formatTime(peminjaman.tanggal_pengajuan)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Peminjam</div>
              <div class="info-value">${peminjaman.peminjam?.nama_lengkap || '-'} (${peminjaman.peminjam?.username || '-'})</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kategori</div>
              <div class="info-value">Peminjaman Alat Laboratorium</div>
            </div>
            <div class="info-row">
              <div class="info-label">Status</div>
              <div class="info-value">
                <span class="status-badge status-${peminjaman.status}">
                  ${statusLabels[peminjaman.status] || peminjaman.status}
                </span>
              </div>
            </div>
          </div>

          <div class="transaction-table">
            <div class="table-header">
              <h3>DETAIL TRANSAKSI PEMINJAMAN</h3>
            </div>
            <div class="table-row">
              <span class="row-label">Kode Alat</span>
              <span class="row-value">${peminjaman.alat?.kode_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Nama Alat</span>
              <span class="row-main">${peminjaman.alat?.nama_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Kategori Alat</span>
              <span class="row-value">${peminjaman.alat?.kategori?.nama_kategori || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Pinjam</span>
              <span class="row-main">${peminjaman.jumlah_pinjam} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Tanggal Pinjam</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_pinjam)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Batas Kembali</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_kembali_rencana)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Lokasi Penyimpanan</span>
              <span class="row-value">${peminjaman.alat?.lokasi_penyimpanan || '-'}</span>
            </div>
          </div>

          ${peminjaman.keperluan || peminjaman.catatan ? `
          <div class="details-section">
            ${peminjaman.keperluan ? `
              <h4>📋 Keperluan Peminjaman</h4>
              <p>${peminjaman.keperluan}</p>
            ` : ''}
            ${peminjaman.catatan ? `
              <h4 style="margin-top: 10px;">📝 Catatan</h4>
              <p>${peminjaman.catatan}</p>
            ` : ''}
          </div>
          ` : ''}

          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="label">Peminjam</div>
                <div class="name">${peminjaman.peminjam?.nama_lengkap || '-'}</div>
                <div class="role">${peminjaman.peminjam?.role || 'Siswa/Guru'}</div>
              </div>
              <div class="signature-box">
                <div class="label">Petugas Laboratorium</div>
                <div class="name">${peminjaman.penyetuju?.nama_lengkap || '________________'}</div>
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
          <button onclick="window.print()" style="padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px;">
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      diajukan: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      disetujui: "bg-primary/20 text-primary border border-primary/30",
      ditolak: "bg-destructive/20 text-destructive border border-destructive/30",
      dipinjam: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
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
    { 
      key: "peminjam", 
      label: "Peminjam", 
      render: (p: Peminjaman) => (
        <div>
          <p className="font-medium text-foreground">{p.peminjam?.nama_lengkap || "-"}</p>
          <p className="text-xs text-muted-foreground">{p.peminjam?.email || ""}</p>
        </div>
      )
    },
    { 
      key: "alat", 
      label: "Alat", 
      render: (p: Peminjaman) => (
        <div>
          <p className="font-medium text-foreground">{p.alat?.nama_alat || "-"}</p>
          <p className="text-xs text-muted-foreground">{p.alat?.kode_alat || ""}</p>
        </div>
      )
    },
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
        <div className="flex gap-1 flex-wrap">
          {/* Setujui */}
          {p.status === "diajukan" && (
            <button
              onClick={() => handleApprove(p.id)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-primary/10 text-primary hover:bg-primary/20"
              title="Setujui peminjaman"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Setujui
            </button>
          )}

          {/* Tolak dengan Modal */}
          {p.status === "diajukan" && (
            <button
              onClick={() => openRejectModal(p)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-destructive/10 text-destructive hover:bg-destructive/20"
              title="Tolak peminjaman"
            >
              <XCircle className="h-3.5 w-3.5" />
              Tolak
            </button>
          )}

          {/* Dipinjam & Cetak - Hanya muncul saat status disetujui */}
          {p.status === "disetujui" && (
            <>
              <button
                onClick={() => handleSetDipinjam(p.id)}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                title="Ubah status ke Dipinjam"
              >
                <Package className="h-3.5 w-3.5" />
                Dipinjam
              </button>

              <button
                onClick={() => generateBuktiPeminjaman(p)}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all"
                title="Cetak bukti peminjaman"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Header 
        title="Approve Peminjaman" 
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari peminjam, alat, kode..."
      />
      
      <div className="p-6 animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Peminjaman</h2>
            <p className="mt-1 text-muted-foreground">Setujui atau tolak permintaan peminjaman</p>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Filter Status Dropdown */}
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
                Status
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
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleStatusFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua Status
                    </button>
                    <button
                      onClick={() => handleStatusFilter("diajukan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "diajukan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Diajukan
                    </button>
                    <button
                      onClick={() => handleStatusFilter("disetujui")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "disetujui" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Disetujui
                    </button>
                    <button
                      onClick={() => handleStatusFilter("ditolak")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "ditolak" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Ditolak
                    </button>
                    <button
                      onClick={() => handleStatusFilter("dipinjam")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "dipinjam" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Dipinjam
                    </button>
                    <button
                      onClick={() => handleStatusFilter("dikembalikan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        statusFilter === "dikembalikan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Dikembalikan
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSortOpen(!isSortOpen)
                  setIsStatusFilterOpen(false)
                }}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-input/30 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-border"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort By
                <ChevronDown className="h-4 w-4" />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleSort("tanggal_pengajuan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "tanggal_pengajuan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tanggal Pengajuan {sortField === "tanggal_pengajuan" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("tanggal_pinjam")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "tanggal_pinjam" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tanggal Pinjam {sortField === "tanggal_pinjam" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("tanggal_kembali_rencana")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "tanggal_kembali_rencana" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tanggal Kembali {sortField === "tanggal_kembali_rencana" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("peminjam")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "peminjam" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Nama Peminjam {sortField === "peminjam" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("alat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "alat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Nama Alat {sortField === "alat" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("jumlah_pinjam")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "jumlah_pinjam" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Jumlah Pinjam {sortField === "jumlah_pinjam" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("status")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "status" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Status {sortField === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all duration-300 hover:bg-destructive/20"
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
          <div className="rounded-2xl glass border border-primary/20 p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Hasil Pencarian untuk "{searchQuery}"
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Menampilkan {filteredAndSortedData.length} dari {peminjamanList.length} peminjaman
                </p>
              </div>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
              >
                Reset Pencarian
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchQuery && filteredAndSortedData.length === 0 && (
          <div className="rounded-2xl glass border border-border/30 p-12 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Tidak Ada Hasil</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tidak ditemukan peminjaman yang sesuai dengan "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90"
            >
              Reset Pencarian
            </button>
          </div>
        )}

        {/* Table */}
        {(!searchQuery || filteredAndSortedData.length > 0) && (
          <DataTable
            columns={columns}
            data={filteredAndSortedData}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={closeRejectModal}
        onConfirm={handleRejectConfirm}
        peminjam={selectedPeminjaman?.peminjam?.nama_lengkap || ""}
        alat={selectedPeminjaman?.alat?.nama_alat || ""}
        isLoading={isRejecting}
      />
    </>
  )
}