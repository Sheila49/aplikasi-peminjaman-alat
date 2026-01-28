"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import toast from "react-hot-toast"
import { Printer, Filter, ArrowUpDown, X, ChevronDown, Search as SearchIcon } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { pengembalianService } from "@/lib/services/pengembalian-service"
import type { Pengembalian } from "@/lib/types"

type KondisiFilter = "all" | "baik" | "rusak"
type DendaFilter = "all" | "ada_denda" | "tanpa_denda"
type TerlambatFilter = "all" | "terlambat" | "tepat_waktu"
type SortField = "tanggal_kembali_aktual" | "peminjam" | "alat" | "denda" | "keterlambatan"
type SortOrder = "asc" | "desc"

export default function PetugasPengembalianPage() {
  const [pengembalianList, setPengembalianList] = useState<Pengembalian[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter & Sort states
  const [kondisiFilter, setKondisiFilter] = useState<KondisiFilter>("all")
  const [dendaFilter, setDendaFilter] = useState<DendaFilter>("all")
  const [terlambatFilter, setTerlambatFilter] = useState<TerlambatFilter>("all")
  const [sortField, setSortField] = useState<SortField>("tanggal_kembali_aktual")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [isKondisiFilterOpen, setIsKondisiFilterOpen] = useState(false)
  const [isDendaFilterOpen, setIsDendaFilterOpen] = useState(false)
  const [isTerlambatFilterOpen, setIsTerlambatFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await pengembalianService.getAll(page, 10)
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
        const keterangan = item.keterangan?.toLowerCase() || ""
        const id = item.id?.toString() || ""
        
        return (
          id.includes(query) ||
          peminjamName.includes(query) ||
          peminjamEmail.includes(query) ||
          alatName.includes(query) ||
          alatKode.includes(query) ||
          kondisi.includes(query) ||
          keterangan.includes(query)
        )
      })
    }

    // 2. FILTER by kondisi
    if (kondisiFilter !== "all") {
      if (kondisiFilter === "baik") {
        result = result.filter((item) => item.kondisi_alat?.toLowerCase() === "baik")
      } else if (kondisiFilter === "rusak") {
        result = result.filter((item) => item.kondisi_alat?.toLowerCase() !== "baik")
      }
    }

    // 3. FILTER by denda
    if (dendaFilter !== "all") {
      if (dendaFilter === "ada_denda") {
        result = result.filter((item) => (item.denda || 0) > 0)
      } else if (dendaFilter === "tanpa_denda") {
        result = result.filter((item) => (item.denda || 0) === 0)
      }
    }

    // 4. FILTER by keterlambatan
    if (terlambatFilter !== "all") {
      if (terlambatFilter === "terlambat") {
        result = result.filter((item) => (item.keterlambatan_hari || 0) > 0)
      } else if (terlambatFilter === "tepat_waktu") {
        result = result.filter((item) => (item.keterlambatan_hari || 0) === 0)
      }
    }

    // 5. SORT
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
  }, [pengembalianList, searchQuery, kondisiFilter, dendaFilter, terlambatFilter, sortField, sortOrder])

  /* ================= HANDLERS ================= */
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleKondisiFilter = (kondisi: KondisiFilter) => {
    setKondisiFilter(kondisi)
    setIsKondisiFilterOpen(false)
    setPage(1)
  }

  const handleDendaFilter = (denda: DendaFilter) => {
    setDendaFilter(denda)
    setIsDendaFilterOpen(false)
    setPage(1)
  }

  const handleTerlambatFilter = (terlambat: TerlambatFilter) => {
    setTerlambatFilter(terlambat)
    setIsTerlambatFilterOpen(false)
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
    setKondisiFilter("all")
    setDendaFilter("all")
    setTerlambatFilter("all")
    setSortField("tanggal_kembali_aktual")
    setSortOrder("desc")
  }

  const hasActiveFilters = searchQuery || kondisiFilter !== "all" || dendaFilter !== "all" || terlambatFilter !== "all"

  const generateBuktiPengembalian = (pengembalian: Pengembalian) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const formatDate = (dateString?: string) => {
      if (!dateString) return "-"
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }

    const formatCurrency = (amount?: number) => {
      if (!amount) return "Rp 0"
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount)
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Pengembalian</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .info-box { padding: 15px; background: #f9fafb; border-radius: 6px; }
          .info-box h3 { font-size: 12px; color: #059669; margin-bottom: 8px; }
          .info-box p { font-size: 11px; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #059669; color: white; font-size: 11px; }
          td { font-size: 11px; }
          .total { margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; text-align: right; }
          .total h3 { font-size: 14px; color: #92400e; }
          .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #6b7280; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BUKTI PENGEMBALIAN ALAT</h1>
          <p>SMK Negeri 1 Jenangan - Laboratorium</p>
        </div>
        
        <div class="info">
          <div class="info-box">
            <h3>PEMINJAM</h3>
            <p><strong>Nama:</strong> ${pengembalian.peminjaman?.peminjam?.nama_lengkap || "-"}</p>
            <p><strong>Email:</strong> ${pengembalian.peminjaman?.peminjam?.email || "-"}</p>
          </div>
          <div class="info-box">
            <h3>PENGEMBALIAN</h3>
            <p><strong>Tanggal Kembali:</strong> ${formatDate(pengembalian.tanggal_kembali_aktual)}</p>
            <p><strong>Keterlambatan:</strong> ${pengembalian.keterlambatan_hari || 0} hari</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Alat</th>
              <th>Jumlah</th>
              <th>Kondisi</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${pengembalian.peminjaman?.alat?.nama_alat || "-"}</td>
              <td>${pengembalian.jumlah_dikembalikan || 0} Unit</td>
              <td>${pengembalian.kondisi_alat || "-"}</td>
              <td>${pengembalian.keterangan || "-"}</td>
            </tr>
          </tbody>
        </table>

        ${
          (pengembalian.denda || 0) > 0
            ? `
        <div class="total">
          <h3>Total Denda: ${formatCurrency(pengembalian.denda)}</h3>
        </div>
        `
            : ""
        }

        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Cetak PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
            Tutup
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const getKondisiBadge = (kondisi: string) => {
    const isGood = kondisi.toLowerCase() === "baik"
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isGood ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
        }`}
      >
        {kondisi}
      </span>
    )
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Rp 0"
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
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
      ),
    },
    {
      key: "alat",
      label: "Alat",
      render: (p: Pengembalian) => (
        <div>
          <p className="font-medium text-foreground">{p.peminjaman?.alat?.nama_alat || "-"}</p>
          <p className="text-xs text-muted-foreground">{p.peminjaman?.alat?.kode_alat || ""}</p>
        </div>
      ),
    },
    {
      key: "jumlah",
      label: "Jumlah",
      render: (p: Pengembalian) => (
        <span className="font-semibold">{p.jumlah_dikembalikan || 0} Unit</span>
      ),
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
      },
    },
    {
      key: "kondisi_alat",
      label: "Kondisi",
      render: (p: Pengembalian) => getKondisiBadge(p.kondisi_alat),
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
      },
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
      ),
    },
  ]

  const activeFilterCount = [
    kondisiFilter !== "all",
    dendaFilter !== "all",
    terlambatFilter !== "all",
  ].filter(Boolean).length

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
            {/* Filter Kondisi */}
            <div className="relative">
              <button
                onClick={() => setIsKondisiFilterOpen(!isKondisiFilterOpen)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  kondisiFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Kondisi
                {kondisiFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </button>

              {isKondisiFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsKondisiFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-48 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleKondisiFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        kondisiFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua Kondisi
                    </button>
                    <button
                      onClick={() => handleKondisiFilter("baik")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        kondisiFilter === "baik" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Baik
                    </button>
                    <button
                      onClick={() => handleKondisiFilter("rusak")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        kondisiFilter === "rusak" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Rusak
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Filter Denda */}
            <div className="relative">
              <button
                onClick={() => setIsDendaFilterOpen(!isDendaFilterOpen)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  dendaFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Denda
                {dendaFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </button>

              {isDendaFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDendaFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-48 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleDendaFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        dendaFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => handleDendaFilter("ada_denda")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        dendaFilter === "ada_denda" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Ada Denda
                    </button>
                    <button
                      onClick={() => handleDendaFilter("tanpa_denda")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        dendaFilter === "tanpa_denda" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tanpa Denda
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Filter Keterlambatan */}
            <div className="relative">
              <button
                onClick={() => setIsTerlambatFilterOpen(!isTerlambatFilterOpen)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  terlambatFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Status
                {terlambatFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </button>

              {isTerlambatFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsTerlambatFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-48 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleTerlambatFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        terlambatFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => handleTerlambatFilter("terlambat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        terlambatFilter === "terlambat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Terlambat
                    </button>
                    <button
                      onClick={() => handleTerlambatFilter("tepat_waktu")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        terlambatFilter === "tepat_waktu" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tepat Waktu
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
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
                      onClick={() => handleSort("tanggal_kembali_aktual")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "tanggal_kembali_aktual" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tanggal Kembali {sortField === "tanggal_kembali_aktual" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("peminjam")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "peminjam" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Peminjam {sortField === "peminjam" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("alat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "alat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Alat {sortField === "alat" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("denda")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "denda" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Denda {sortField === "denda" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("keterlambatan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "keterlambatan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Keterlambatan {sortField === "keterlambatan" && (sortOrder === "asc" ? "↑" : "↓")}
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
            <span className="font-semibold text-foreground">{pengembalianList.length}</span> pengembalian
          </div>
        </div>

        {/* Search Result Info */}
        {searchQuery && (
          <div className="rounded-xl glass p-4 border border-primary/20 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Hasil pencarian untuk <span className="font-semibold text-primary">"{searchQuery}"</span>
              {filteredAndSortedData.length === 0 && " - Tidak ada hasil ditemukan"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {(searchQuery || hasActiveFilters) && filteredAndSortedData.length === 0 && (
          <div className="rounded-2xl glass border border-border/30 p-12 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Tidak Ada Hasil</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tidak ditemukan pengembalian yang sesuai dengan filter yang dipilih
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90"
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