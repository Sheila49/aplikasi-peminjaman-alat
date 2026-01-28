"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import toast from "react-hot-toast"
import { Trash2, CheckCircle, XCircle, Search as SearchIcon, Filter, ArrowUpDown, X, ChevronDown } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { RejectModal } from "@/components/dashboard/reject-modal"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import type { Peminjaman, StatusPeminjaman } from "@/lib/types"

type StatusFilter = "all" | "diajukan" | "disetujui" | "ditolak" | "dipinjam" | "dikembalikan"
type SortField = "tanggal_pengajuan" | "tanggal_kembali_rencana" | "peminjam" | "alat" | "status"
type SortOrder = "asc" | "desc"

export default function PeminjamanPage() {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter & Sort states
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortField, setSortField] = useState<SortField>("tanggal_pengajuan")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  // ✅ Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null)
  const [isRejecting, setIsRejecting] = useState(false)

  const statusLabel: Record<StatusPeminjaman, string> = {
    diajukan: "Menunggu Persetujuan",
    disetujui: "Sedang Disetujui",
    dipinjam: "Sedang Dipinjam",
    dikembalikan: "Sudah Dikembalikan",
    ditolak: "Ditolak",
  }

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
        case "tanggal_kembali_rencana":
          const dateA = a.tanggal_kembali_rencana ? new Date(a.tanggal_kembali_rencana).getTime() : 0
          const dateB = b.tanggal_kembali_rencana ? new Date(b.tanggal_kembali_rencana).getTime() : 0
          compareValue = dateA - dateB
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
    setIsFilterOpen(false)
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

  // ✅ Buka modal reject
  const openRejectModal = (peminjaman: Peminjaman) => {
    setSelectedPeminjaman(peminjaman)
    setIsRejectModalOpen(true)
  }

  // ✅ Tutup modal reject
  const closeRejectModal = () => {
    if (!isRejecting) {
      setIsRejectModalOpen(false)
      setSelectedPeminjaman(null)
    }
  }

  // ✅ Handler reject dengan keterangan
  const handleRejectConfirm = async (keterangan: string) => {
    if (!selectedPeminjaman) return
    
    setIsRejecting(true)
    try {
      await peminjamanService.reject(selectedPeminjaman.id, keterangan) // ✅ 2 parameter
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

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus peminjaman ini?")) return
    try {
      await peminjamanService.delete(id)
      toast.success("Peminjaman berhasil dihapus")
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus peminjaman")
      console.error(error)
    }
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
    { key: "jumlah_pinjam", label: "Jumlah" },
    {
      key: "tanggal_pinjam",
      label: "Tgl Pinjam",
      render: (p: Peminjaman) =>
        p.tanggal_pinjam ? new Date(p.tanggal_pinjam).toLocaleDateString("id-ID") : "-",
    },
    {
      key: "tanggal_kembali_rencana",
      label: "Tgl Kembali",
      render: (p: Peminjaman) =>
        p.tanggal_kembali_rencana
          ? new Date(p.tanggal_kembali_rencana).toLocaleDateString("id-ID")
          : "-",
    },
    { key: "status", label: "Status", render: (p: Peminjaman) => getStatusBadge(p.status) },
    {
      key: "actions",
      label: "Aksi",
      render: (p: Peminjaman) => (
        <div className="flex gap-1">
          {p.status === "diajukan" && (
            <>
              <button
                onClick={() => handleApprove(p.id)}
                className="rounded-xl p-2 text-primary transition-all duration-300 hover:bg-primary/10"
                title="Setujui"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              {/* ✅ Ganti ke openRejectModal */}
              <button
                onClick={() => openRejectModal(p)}
                className="rounded-xl p-2 text-destructive transition-all duration-300 hover:bg-destructive/10"
                title="Tolak"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(p.id)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Header 
        title="Manajemen Peminjaman" 
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari peminjam, alat, status..."
      />
      
      <div className="p-6 animate-fade-in space-y-6">
        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Filter Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  statusFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter Status
                {statusFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
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
                      onClick={() => handleSort("tanggal_pengajuan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "tanggal_pengajuan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tanggal Pengajuan {sortField === "tanggal_pengajuan" && (sortOrder === "asc" ? "↑" : "↓")}
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

        {/* Data Table */}
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

      {/* ✅ Reject Modal */}
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