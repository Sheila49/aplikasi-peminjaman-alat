"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import toast from "react-hot-toast"
import { Filter, ArrowUpDown, X, ChevronDown, Search as SearchIcon } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { logService } from "@/lib/services/log-service"
import type { LogAktivitas } from "@/lib/types"

type AksiFilter = "all" | "create" | "update" | "delete" | "login" | "logout"
type TabelFilter = "all" | "users" | "alat" | "kategori" | "peminjaman" | "pengembalian"
type SortField = "created_at" | "user" | "aksi" | "tabel"
type SortOrder = "asc" | "desc"

export default function LogsPage() {
  const [logs, setLogs] = useState<LogAktivitas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter & Sort states
  const [aksiFilter, setAksiFilter] = useState<AksiFilter>("all")
  const [tabelFilter, setTabelFilter] = useState<TabelFilter>("all")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [isAksiFilterOpen, setIsAksiFilterOpen] = useState(false)
  const [isTabelFilterOpen, setIsTabelFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await logService.getAll(page)
      
      // ✅ Debug: Log response
      console.log("=== LOGS PAGE RECEIVED DATA ===")
      console.log("Total logs:", res.data.length)
      console.log("First log:", res.data[0])
      console.log("First log user:", res.data[0]?.user)
      console.log("First log user_id:", res.data[0]?.user_id)
      
      setLogs(res.data)

      if (res.pagination && typeof res.pagination.totalPages === "number") {
        setTotalPages(res.pagination.totalPages)
      } else if ((res as any).totalPages) {
        setTotalPages((res as any).totalPages)
      } else {
        setTotalPages(1)
      }
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

  /* ================= SEARCH, FILTER & SORT LOGIC ================= */
  const filteredAndSortedData = useMemo(() => {
    let result = [...logs]

    // 1. SEARCH - cari di semua field relevan
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const userName = item.user?.nama_lengkap?.toLowerCase() || ""
        const userEmail = item.user?.email?.toLowerCase() || ""
        const userUsername = item.user?.username?.toLowerCase() || ""
        const aksi = item.aksi?.toLowerCase() || ""
        const tabel = item.tabel?.toLowerCase() || ""
        const keterangan = item.keterangan?.toLowerCase() || ""
        const dataId = item.record_id?.toString() || item.data_id?.toString() || ""
        const id = item.id?.toString() || ""
        
        return (
          id.includes(query) ||
          userName.includes(query) ||
          userEmail.includes(query) ||
          userUsername.includes(query) ||
          aksi.includes(query) ||
          tabel.includes(query) ||
          keterangan.includes(query) ||
          dataId.includes(query)
        )
      })
    }

    // 2. FILTER by aksi
    if (aksiFilter !== "all") {
      result = result.filter((item) => item.aksi?.toLowerCase() === aksiFilter.toLowerCase())
    }

    // 3. FILTER by tabel
    if (tabelFilter !== "all") {
      result = result.filter((item) => item.tabel?.toLowerCase() === tabelFilter.toLowerCase())
    }

    // 4. SORT
    result.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "created_at":
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          compareValue = dateA - dateB
          break
        case "user":
          compareValue = (a.user?.nama_lengkap || "").localeCompare(b.user?.nama_lengkap || "")
          break
        case "aksi":
          compareValue = (a.aksi || "").localeCompare(b.aksi || "")
          break
        case "tabel":
          compareValue = (a.tabel || "").localeCompare(b.tabel || "")
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [logs, searchQuery, aksiFilter, tabelFilter, sortField, sortOrder])

  /* ================= HANDLERS ================= */
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleAksiFilter = (aksi: AksiFilter) => {
    setAksiFilter(aksi)
    setIsAksiFilterOpen(false)
    setPage(1)
  }

  const handleTabelFilter = (tabel: TabelFilter) => {
    setTabelFilter(tabel)
    setIsTabelFilterOpen(false)
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
    setAksiFilter("all")
    setTabelFilter("all")
    setSortField("created_at")
    setSortOrder("desc")
  }

  const hasActiveFilters = searchQuery || aksiFilter !== "all" || tabelFilter !== "all"

  /* ================= AKSI BADGE ================= */
  const getAksiBadge = (aksi: string) => {
    const aksiLower = aksi?.toLowerCase() || ""
    const aksiConfig: Record<string, { bg: string; text: string; label: string }> = {
      create: { bg: "bg-green-500/20", text: "text-green-500", label: "Create" },
      insert: { bg: "bg-green-500/20", text: "text-green-500", label: "Insert" },
      update: { bg: "bg-blue-500/20", text: "text-blue-500", label: "Update" },
      delete: { bg: "bg-red-500/20", text: "text-red-500", label: "Delete" },
      login: { bg: "bg-purple-500/20", text: "text-purple-500", label: "Login" },
      logout: { bg: "bg-gray-500/20", text: "text-gray-500", label: "Logout" },
      approve: { bg: "bg-cyan-500/20", text: "text-cyan-500", label: "Approve" },
      reject: { bg: "bg-orange-500/20", text: "text-orange-500", label: "Reject" },
    }

    const config = aksiConfig[aksiLower] || { bg: "bg-gray-500/20", text: "text-gray-500", label: aksi }
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    { key: "id", label: "ID" },
    {
      key: "user",
      label: "User",
      render: (log: LogAktivitas) => {
        // ✅ Debug individual log render
        console.log(`Rendering log ${log.id}:`, {
          user_id: log.user_id,
          user: log.user,
          hasUser: !!log.user,
          userName: log.user?.nama_lengkap,
        })

        // ✅ Better fallback handling
        if (!log.user && !log.user_id) {
          return <span className="text-muted-foreground italic">System</span>
        }

        if (!log.user) {
          return (
            <div>
              <p className="text-xs text-muted-foreground">User ID: {log.user_id}</p>
              <p className="text-xs text-destructive italic">Data not loaded</p>
            </div>
          )
        }

        return (
          <div>
            <p className="font-medium text-foreground">{log.user.nama_lengkap || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{log.user.email || log.user.username || ""}</p>
          </div>
        )
      },
    },
    {
      key: "aksi",
      label: "Aksi",
      render: (log: LogAktivitas) => getAksiBadge(log.aksi || ""),
    },
    {
      key: "tabel",
      label: "Tabel",
      render: (log: LogAktivitas) => (
        <span className="font-mono text-xs font-medium text-foreground">{log.tabel || "-"}</span>
      ),
    },
    {
      key: "record_id",
      label: "Record ID",
      render: (log: LogAktivitas) => (
        <span className="font-mono text-xs text-muted-foreground">
          {log.record_id || log.data_id || "-"}
        </span>
      ),
    },
    {
      key: "keterangan",
      label: "Keterangan",
      render: (log: LogAktivitas) => (
        <span className="text-xs text-muted-foreground line-clamp-2">
          {log.keterangan || "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Waktu",
      render: (log: LogAktivitas) => {
        if (!log.created_at) return "-"
        const date = new Date(log.created_at)
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{date.toLocaleDateString("id-ID")}</p>
            <p className="text-muted-foreground">{date.toLocaleTimeString("id-ID")}</p>
          </div>
        )
      },
    },
  ]

  /* ================= RENDER ================= */
  return (
    <>
      <Header
        title="Log Aktivitas"
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari user, aksi, tabel, keterangan..."
      />

      <div className="p-6 space-y-6">
        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Filter Aksi Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAksiFilterOpen(!isAksiFilterOpen)
                  setIsTabelFilterOpen(false)
                  setIsSortOpen(false)
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  aksiFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter Aksi
                {aksiFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </button>

              {isAksiFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsAksiFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleAksiFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        aksiFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua Aksi
                    </button>
                    <button
                      onClick={() => handleAksiFilter("create")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        aksiFilter === "create" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => handleAksiFilter("update")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        aksiFilter === "update" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleAksiFilter("delete")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        aksiFilter === "delete" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleAksiFilter("login")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        aksiFilter === "login" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleAksiFilter("logout")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        aksiFilter === "logout" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Filter Tabel Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsTabelFilterOpen(!isTabelFilterOpen)
                  setIsAksiFilterOpen(false)
                  setIsSortOpen(false)
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  tabelFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter Tabel
                {tabelFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </button>

              {isTabelFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsTabelFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleTabelFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        tabelFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua Tabel
                    </button>
                    <button
                      onClick={() => handleTabelFilter("users")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        tabelFilter === "users" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Users
                    </button>
                    <button
                      onClick={() => handleTabelFilter("alat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        tabelFilter === "alat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Alat
                    </button>
                    <button
                      onClick={() => handleTabelFilter("kategori")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        tabelFilter === "kategori" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Kategori
                    </button>
                    <button
                      onClick={() => handleTabelFilter("peminjaman")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        tabelFilter === "peminjaman" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Peminjaman
                    </button>
                    <button
                      onClick={() => handleTabelFilter("pengembalian")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        tabelFilter === "pengembalian" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Pengembalian
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
                  setIsAksiFilterOpen(false)
                  setIsTabelFilterOpen(false)
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
                      onClick={() => handleSort("created_at")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "created_at" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Waktu {sortField === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("user")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "user" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      User {sortField === "user" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("aksi")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "aksi" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Aksi {sortField === "aksi" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("tabel")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "tabel" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Tabel {sortField === "tabel" && (sortOrder === "asc" ? "↑" : "↓")}
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
            <span className="font-semibold text-foreground">{logs.length}</span> log
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
              Tidak ditemukan log aktivitas yang sesuai dengan filter yang dipilih
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