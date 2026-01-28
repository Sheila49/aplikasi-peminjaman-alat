"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Plus, Pencil, Trash2, Loader2, Search as SearchIcon, Filter, ArrowUpDown, X, ChevronDown } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Modal } from "@/components/dashboard/modal"

import { alatService } from "@/lib/services/alat-service"
import { kategoriService } from "@/lib/services/kategori-service"
import { alatSchema, type AlatFormData } from "@/lib/validations"
import type { Alat, Kategori, KondisiAlat } from "@/lib/types"

// ✅ FIX: Sesuaikan dengan database (lowercase)
type KondisiFilter = "all" | "baik" | "rusak ringan" | "rusak berat"
type KategoriFilter = "all" | number
type SortField = "nama_alat" | "kode_alat" | "kategori" | "jumlah_total" | "jumlah_tersedia" | "kondisi" | "lokasi_penyimpanan"
type SortOrder = "asc" | "desc"

export default function AlatPage() {
  const [alatList, setAlatList] = useState<Alat[]>([])
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlat, setEditingAlat] = useState<Alat | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter & Sort states
  const [kondisiFilter, setKondisiFilter] = useState<KondisiFilter>("all")
  const [kategoriFilter, setKategoriFilter] = useState<KategoriFilter>("all")
  const [sortField, setSortField] = useState<SortField>("nama_alat")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [isKondisiFilterOpen, setIsKondisiFilterOpen] = useState(false)
  const [isKategoriFilterOpen, setIsKategoriFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlatFormData>({
    resolver: zodResolver(alatSchema),
  })

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [alatRes, kategoriRes] = await Promise.all([
        alatService.getAll(page),
        kategoriService.getAll(1, 100),
      ])

      setAlatList(alatRes.data)
      setTotalPages(alatRes.pagination.totalPages)
      setKategoriList(kategoriRes.data)
    } catch (error) {
      toast.error("Gagal memuat data")
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
    let result = [...alatList]

    // 1. SEARCH
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const kodeAlat = item.kode_alat?.toLowerCase() || ""
        const namaAlat = item.nama_alat?.toLowerCase() || ""
        const kategoriName = item.kategori?.nama_kategori?.toLowerCase() || ""
        const lokasi = item.lokasi_penyimpanan?.toLowerCase() || ""
        const deskripsi = item.deskripsi?.toLowerCase() || ""
        const kondisi = item.kondisi?.toLowerCase() || ""
        const id = item.id?.toString() || ""
        
        return (
          id.includes(query) ||
          kodeAlat.includes(query) ||
          namaAlat.includes(query) ||
          kategoriName.includes(query) ||
          lokasi.includes(query) ||
          deskripsi.includes(query) ||
          kondisi.includes(query)
        )
      })
    }

    // 2. FILTER by Kondisi
    if (kondisiFilter !== "all") {
      result = result.filter((item) => item.kondisi.toLowerCase() === kondisiFilter)
    }

    // 3. FILTER by Kategori
    if (kategoriFilter !== "all") {
      result = result.filter((item) => item.kategori_id === kategoriFilter)
    }

    // 4. SORT
    result.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "nama_alat":
          compareValue = (a.nama_alat || "").localeCompare(b.nama_alat || "")
          break
        case "kode_alat":
          compareValue = (a.kode_alat || "").localeCompare(b.kode_alat || "")
          break
        case "kategori":
          compareValue = (a.kategori?.nama_kategori || "").localeCompare(b.kategori?.nama_kategori || "")
          break
        case "jumlah_total":
          compareValue = (a.jumlah_total || 0) - (b.jumlah_total || 0)
          break
        case "jumlah_tersedia":
          compareValue = (a.jumlah_tersedia || 0) - (b.jumlah_tersedia || 0)
          break
        case "kondisi":
          compareValue = (a.kondisi || "").localeCompare(b.kondisi || "")
          break
        case "lokasi_penyimpanan":
          compareValue = (a.lokasi_penyimpanan || "").localeCompare(b.lokasi_penyimpanan || "")
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [alatList, searchQuery, kondisiFilter, kategoriFilter, sortField, sortOrder])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleKondisiFilter = (kondisi: KondisiFilter) => {
    setKondisiFilter(kondisi)
    setIsKondisiFilterOpen(false)
    setPage(1)
  }

  const handleKategoriFilter = (kategori: KategoriFilter) => {
    setKategoriFilter(kategori)
    setIsKategoriFilterOpen(false)
    setPage(1)
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
    setKondisiFilter("all")
    setKategoriFilter("all")
    setSortField("nama_alat")
    setSortOrder("asc")
  }

  const hasActiveFilters = searchQuery || kondisiFilter !== "all" || kategoriFilter !== "all"

  /* ================= MODAL ================= */
  const openCreateModal = () => {
    setEditingAlat(null)
    reset({
      kode_alat: "",
      nama_alat: "",
      kategori_id: undefined,
      jumlah_total: 1,
      jumlah_tersedia: 1,
      kondisi: "baik",
      lokasi_penyimpanan: "",
      deskripsi: "",
      gambar_url: ""
    })
    setIsModalOpen(true)
  }

  const openEditModal = (alat: Alat) => {
    setEditingAlat(alat)
    reset({
      kode_alat: alat.kode_alat,
      nama_alat: alat.nama_alat,
      kategori_id: alat.kategori_id,
      jumlah_total: alat.jumlah_total,
      jumlah_tersedia: alat.jumlah_tersedia,
      kondisi: alat.kondisi,
      lokasi_penyimpanan: alat.lokasi_penyimpanan || "",
      deskripsi: alat.deskripsi || "",
      gambar_url: alat.gambar_url || ""
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: AlatFormData) => {
    console.log("=== FORM SUBMIT DEBUG ===")
    console.log("1. Raw form data:", data)
    
    setIsSubmitting(true)
    
    try {
      if (editingAlat) {
        await alatService.update(editingAlat.id, data)
        toast.success("Alat berhasil diperbarui")
      } else {
        await alatService.create(data)
        toast.success("Alat berhasil ditambahkan")
      }
      setIsModalOpen(false)
      reset()
      fetchData()
    } catch (error: any) {
      console.error("=== SUBMIT ERROR ===")
      console.error("2. Error object:", error)
      console.error("3. Error message:", error.message)
      
      const errorMessage = error.message || "Gagal menyimpan alat. Silakan cek data dan coba lagi."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus alat ini?")) return
    try {
      await alatService.delete(id)
      toast.success("Alat berhasil dihapus")
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus alat")
      console.error(error)
    }
  }

  /* ================= HELPER FUNCTION ================= */
  const formatKondisi = (kondisi: string) => {
    // Convert dari database format ke display format
    const kondisiMap: Record<string, string> = {
      "baik": "Baik",
      "rusak ringan": "Rusak Ringan",
      "rusak berat": "Rusak Berat"
    }
    return kondisiMap[kondisi.toLowerCase()] || kondisi
  }

  /* ================= TABLE ================= */
  const columns = [
    { key: "id", label: "ID" },
    { key: "kode_alat", label: "Kode Alat" },
    { key: "nama_alat", label: "Nama Alat" },
    {
      key: "kategori",
      label: "Kategori",
      render: (alat: Alat) => alat.kategori?.nama_kategori || "-",
    },
    { key: "jumlah_total", label: "Jumlah Total" },
    { key: "jumlah_tersedia", label: "Jumlah Tersedia" },
    { key: "lokasi_penyimpanan", label: "Lokasi" },
    {
      key: "kondisi",
      label: "Kondisi",
      render: (alat: Alat) => {
        const kondisiLower = alat.kondisi.toLowerCase()
        const isGood = kondisiLower === "baik"
        
        return (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              isGood
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-destructive/20 text-destructive border border-destructive/30"
            }`}
          >
            {formatKondisi(alat.kondisi)}
          </span>
        )
      },
    },
    {
      key: "actions",
      label: "Aksi",
      render: (alat: Alat) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(alat)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(alat.id)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  /* ================= UI ================= */
  return (
    <>
      <Header 
        title="Manajemen Alat"
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari kode, nama alat, kategori, lokasi..."
      />

      <div className="p-6 animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Alat</h2>
            <p className="mt-1 text-muted-foreground">Kelola inventaris alat laboratorium</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Tambah Alat
          </button>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Filter Kondisi Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsKondisiFilterOpen(!isKondisiFilterOpen)
                  setIsKategoriFilterOpen(false)
                  setIsSortOpen(false)
                }}
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
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
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
                      onClick={() => handleKondisiFilter("rusak ringan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        kondisiFilter === "rusak ringan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Rusak Ringan
                    </button>
                    <button
                      onClick={() => handleKondisiFilter("rusak berat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        kondisiFilter === "rusak berat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Rusak Berat
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Filter Kategori Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsKategoriFilterOpen(!isKategoriFilterOpen)
                  setIsKondisiFilterOpen(false)
                  setIsSortOpen(false)
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  kategoriFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Kategori
                {kategoriFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>

              {isKategoriFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsKategoriFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up max-h-64 overflow-y-auto">
                    <button
                      onClick={() => handleKategoriFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        kategoriFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua Kategori
                    </button>
                    {kategoriList.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => handleKategoriFilter(k.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          kategoriFilter === k.id ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                        }`}
                      >
                        {k.nama_kategori}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSortOpen(!isSortOpen)
                  setIsKondisiFilterOpen(false)
                  setIsKategoriFilterOpen(false)
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
                      onClick={() => handleSort("nama_alat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "nama_alat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Nama Alat {sortField === "nama_alat" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("kode_alat")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "kode_alat" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Kode Alat {sortField === "kode_alat" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("kategori")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "kategori" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Kategori {sortField === "kategori" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("jumlah_total")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "jumlah_total" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Jumlah Total {sortField === "jumlah_total" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("jumlah_tersedia")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "jumlah_tersedia" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Jumlah Tersedia {sortField === "jumlah_tersedia" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("kondisi")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "kondisi" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Kondisi {sortField === "kondisi" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("lokasi_penyimpanan")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "lokasi_penyimpanan" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Lokasi {sortField === "lokasi_penyimpanan" && (sortOrder === "asc" ? "↑" : "↓")}
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
            <span className="font-semibold text-foreground">{alatList.length}</span> alat
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
                  Menampilkan {filteredAndSortedData.length} dari {alatList.length} alat
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
              Tidak ditemukan alat yang sesuai dengan "{searchQuery}"
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingAlat ? "Edit Alat" : "Tambah Alat Baru"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Kode & Nama Alat */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kode Alat <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("kode_alat")}
                  placeholder="e.g., LAB-001"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.kode_alat && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.kode_alat.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nama Alat <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("nama_alat")}
                  placeholder="e.g., Mikroskop Digital"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.nama_alat && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.nama_alat.message}</p>
                )}
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kategori <span className="text-destructive">*</span>
              </label>
              <select
                {...register("kategori_id", {
                  setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
                })}
                defaultValue=""
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="" disabled>Pilih Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={String(k.id)}>{k.nama_kategori}</option>
                ))}
              </select>
              {errors.kategori_id && (
                <p className="mt-1.5 text-xs text-destructive">{errors.kategori_id.message}</p>
              )}
            </div>

            {/* Jumlah */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jumlah Total <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  {...register("jumlah_total", { valueAsNumber: true })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.jumlah_total && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.jumlah_total.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jumlah Tersedia <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("jumlah_tersedia", { valueAsNumber: true })}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.jumlah_tersedia && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.jumlah_tersedia.message}</p>
                )}
              </div>
            </div>

            {/* Kondisi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kondisi <span className="text-destructive">*</span>
              </label>
              <select
                {...register("kondisi")}
                defaultValue="baik"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="baik">Baik</option>
                <option value="rusak ringan">Rusak Ringan</option>
                <option value="rusak berat">Rusak Berat</option>
              </select>
              {errors.kondisi && (
                <p className="mt-1.5 text-xs text-destructive">{errors.kondisi.message}</p>
              )}
            </div>

            {/* Lokasi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Lokasi Penyimpanan
              </label>
              <input
                {...register("lokasi_penyimpanan")}
                placeholder="e.g., Ruang Lab A - Rak 3"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Deskripsi
              </label>
              <textarea
                {...register("deskripsi")}
                rows={3}
                placeholder="Deskripsi detail tentang alat..."
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* URL Gambar */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                URL Gambar
              </label>
              <input
                {...register("gambar_url")}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl border-2 border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}