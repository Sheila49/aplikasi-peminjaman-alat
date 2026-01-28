"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Package, ClipboardList, Loader2, Sparkles, Search, Filter, SortAsc } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Modal } from "@/components/dashboard/modal"
import { alatService } from "@/lib/services/alat-service"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { peminjamanSchema, type PeminjamanFormData } from "@/lib/validations"
import { useAuthStore } from "@/store/auth-store"
import type { Alat } from "@/lib/types"

export default function PeminjamAlatPage() {
  const { user } = useAuthStore()
  const [alatList, setAlatList] = useState<Alat[]>([])
  const [filteredAlatList, setFilteredAlatList] = useState<Alat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAlat, setSelectedAlat] = useState<Alat | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Search, Filter, Sort states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterKategori, setFilterKategori] = useState<string>("all")
  const [filterKondisi, setFilterKondisi] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("nama_asc")
  const [kategoriList, setKategoriList] = useState<Array<{id: number, nama_kategori: string}>>([])

  // Fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<PeminjamanFormData>({
    resolver: zodResolver(peminjamanSchema),
    defaultValues: {
      jumlah_pinjam: 1,
      tanggal_pinjam: getTodayDate(),
      tanggal_kembali_rencana: "",
      catatan: "",
    }
  })

  const formValues = watch()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await alatService.getAll(1, 100)
      const availableAlat = res.data.filter((a) => a.jumlah_tersedia > 0)
      setAlatList(availableAlat)
      
      // Extract unique categories
      const uniqueKategori = Array.from(
        new Map(
          availableAlat
            .filter(a => a.kategori)
            .map(a => [a.kategori!.id, a.kategori!])
        ).values()
      )
      setKategoriList(uniqueKategori)
    } catch (error) {
      toast.error("Gagal memuat data alat")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Apply search, filter, and sort
  useEffect(() => {
    let result = [...alatList]

    // Search by nama_alat or kode_alat
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (alat) =>
          alat.nama_alat.toLowerCase().includes(query) ||
          alat.kode_alat.toLowerCase().includes(query) ||
          alat.kategori?.nama_kategori.toLowerCase().includes(query)
      )
    }

    // Filter by kategori
    if (filterKategori !== "all") {
      result = result.filter((alat) => alat.kategori?.id === Number(filterKategori))
    }

    // Filter by kondisi
    if (filterKondisi !== "all") {
      result = result.filter((alat) => alat.kondisi.toLowerCase() === filterKondisi.toLowerCase())
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "nama_asc":
          return a.nama_alat.localeCompare(b.nama_alat)
        case "nama_desc":
          return b.nama_alat.localeCompare(a.nama_alat)
        case "stok_asc":
          return (a.jumlah_tersedia || 0) - (b.jumlah_tersedia || 0)
        case "stok_desc":
          return (b.jumlah_tersedia || 0) - (a.jumlah_tersedia || 0)
        case "kode_asc":
          return a.kode_alat.localeCompare(b.kode_alat)
        case "kode_desc":
          return b.kode_alat.localeCompare(a.kode_alat)
        default:
          return 0
      }
    })

    setFilteredAlatList(result)
  }, [alatList, searchQuery, filterKategori, filterKondisi, sortBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openPinjamModal = (alat: Alat) => {
    setSelectedAlat(alat)
    const todayDate = getTodayDate()
    reset({
      alat_id: alat.id,
      jumlah_pinjam: 1,
      tanggal_pinjam: todayDate,
      tanggal_kembali_rencana: "",
      catatan: "",
    })
    setValue("alat_id", alat.id, { shouldValidate: true, shouldDirty: true })
    setValue("tanggal_pinjam", todayDate, { shouldValidate: true, shouldDirty: true })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: PeminjamanFormData) => {
    if (!user?.id) {
      toast.error("User tidak ditemukan. Silakan login kembali.")
      return
    }

    if (!data.alat_id) {
      toast.error("Alat ID tidak valid")
      return
    }

    if (data.jumlah_pinjam < 1 || data.jumlah_pinjam > (selectedAlat?.jumlah_tersedia || 0)) {
      toast.error(`Jumlah harus antara 1 dan ${selectedAlat?.jumlah_tersedia}`)
      return
    }

    if (!data.tanggal_pinjam || !data.tanggal_kembali_rencana) {
      toast.error("Tanggal pinjam dan kembali harus diisi")
      return
    }

    if (new Date(data.tanggal_kembali_rencana) <= new Date(data.tanggal_pinjam)) {
      toast.error("Tanggal kembali harus setelah tanggal pinjam")
      return
    }

    setIsSubmitting(true)
    try {
      // Payload MINIMAL - hanya field yang diterima backend
      const payload = {
        alat_id: Number(data.alat_id),
        jumlah_pinjam: Number(data.jumlah_pinjam),
        tanggal_kembali_rencana: data.tanggal_kembali_rencana,
        keperluan: data.catatan?.trim() || "Peminjaman alat",
      }

      console.log("Sending payload:", payload)
      await peminjamanService.create(payload)
      toast.success("Pengajuan peminjaman berhasil!")
      setIsModalOpen(false)
      reset()
      setSelectedAlat(null)
      fetchData()
    } catch (err: any) {
      console.error("Error:", err)
      console.error("Error response:", err?.response?.data)
      
      // Better error handling
      if (err?.response?.status === 400) {
        const errorData = err.response.data
        let errorMsg = "Validasi gagal"
        
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const msgs = errorData.errors.map((e: any) => e.message || e.msg).filter(Boolean)
          if (msgs.length) errorMsg = msgs.join(", ")
        } else if (errorData?.message) {
          errorMsg = errorData.message
        }
        
        toast.error(errorMsg)
      } else {
        const errorMsg = err?.response?.data?.message || err?.message || "Gagal mengajukan peminjaman"
        toast.error(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormError = (errors: any) => {
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error(firstError.message)
    }
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("")
    setFilterKategori("all")
    setFilterKondisi("all")
    setSortBy("nama_asc")
  }

  return (
    <>
      <Header title="Daftar Alat" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Alat Tersedia</h2>
          <p className="mt-1 text-muted-foreground">Pilih alat yang ingin dipinjam</p>
        </div>

        {/* Search, Filter, and Sort Section */}
        <div className="mb-6 space-y-4 rounded-2xl glass p-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama alat, kode alat, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border/50 bg-input/30 pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
            />
          </div>

          {/* Filters and Sort */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filter by Kategori */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Filter className="h-4 w-4" />
                Kategori
              </label>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-2.5 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              >
                <option value="all">Semua Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat.id} value={kat.id}>
                    {kat.nama_kategori}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Kondisi */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Filter className="h-4 w-4" />
                Kondisi
              </label>
              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-2.5 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              >
                <option value="all">Semua Kondisi</option>
                <option value="baik">Baik</option>
                <option value="rusak ringan">Rusak Ringan</option>
                <option value="rusak berat">Rusak Berat</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-card-foreground">
                <SortAsc className="h-4 w-4" />
                Urutkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-2.5 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              >
                <option value="nama_asc">Nama (A-Z)</option>
                <option value="nama_desc">Nama (Z-A)</option>
                <option value="kode_asc">Kode (A-Z)</option>
                <option value="kode_desc">Kode (Z-A)</option>
                <option value="stok_asc">Stok (Rendah-Tinggi)</option>
                <option value="stok_desc">Stok (Tinggi-Rendah)</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full rounded-2xl border border-border/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Menampilkan <span className="font-semibold text-card-foreground">{filteredAlatList.length}</span> dari <span className="font-semibold text-card-foreground">{alatList.length}</span> alat
            </span>
            {(searchQuery || filterKategori !== "all" || filterKondisi !== "all" || sortBy !== "nama_asc") && (
              <span className="text-xs text-primary">Filter aktif</span>
            )}
          </div>
        </div>

        {/* Alat List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl glass">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          </div>
        ) : filteredAlatList.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl glass">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery || filterKategori !== "all" || filterKondisi !== "all" 
                ? "Tidak ada alat yang sesuai dengan filter"
                : "Tidak ada alat tersedia"}
            </p>
            {(searchQuery || filterKategori !== "all" || filterKondisi !== "all") && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAlatList.map((alat, index) => (
              <div
                key={alat.id}
                className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-br from-primary/5 to-transparent" />

                <div className="relative">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary glow-primary transition-transform duration-300 group-hover:scale-110">
                    <Package className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-card-foreground">{alat.nama_alat}</h3>
                  <p className="mb-1 text-xs font-mono text-muted-foreground">{alat.kode_alat}</p>
                  <p className="mb-3 text-sm text-muted-foreground">{alat.kategori?.nama_kategori || "Tanpa Kategori"}</p>
                  <div className="mb-5 flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Stok: <span className="font-semibold text-card-foreground">{alat.jumlah_tersedia}</span>
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        alat.kondisi.toLowerCase() === "baik" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {alat.kondisi}
                    </span>
                  </div>
                  <button
                    onClick={() => openPinjamModal(alat)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 glow-primary"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Pinjam Alat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form Peminjaman */}
        <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Ajukan Peminjaman">
          <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-5">
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedAlat?.nama_alat}</p>
                  <p className="text-xs text-muted-foreground">Stok tersedia: {selectedAlat?.jumlah_tersedia}</p>
                </div>
              </div>
            </div>

            <input type="hidden" {...register("alat_id", { valueAsNumber: true, required: "Alat ID harus ada" })} />

            <div>
              <label className="text-sm font-medium text-card-foreground">Jumlah *</label>
              <input
                {...register("jumlah_pinjam", { valueAsNumber: true })}
                type="number"
                min={1}
                max={selectedAlat?.jumlah_tersedia || 1}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.jumlah_pinjam && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.jumlah_pinjam.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-card-foreground">Tanggal Pinjam *</label>
                <input
                  {...register("tanggal_pinjam")}
                  type="date"
                  min={getTodayDate()}
                  className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                />
                {errors.tanggal_pinjam && (
                  <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.tanggal_pinjam.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground">Tanggal Kembali *</label>
                <input
                  {...register("tanggal_kembali_rencana")}
                  type="date"
                  min={formValues.tanggal_pinjam || getTodayDate()}
                  className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                />
                {errors.tanggal_kembali_rencana && (
                  <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.tanggal_kembali_rencana.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">
                Keperluan Peminjaman <span className="text-destructive">*</span>
              </label>
              <textarea
                {...register("catatan", { required: "Keperluan harus diisi" })}
                rows={2}
                placeholder="Untuk praktikum, penelitian, dll..."
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.catatan && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.catatan.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  reset()
                  setSelectedAlat(null)
                }}
                disabled={isSubmitting}
                className="rounded-2xl border border-border/50 px-5 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-50 glow-primary"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Mengajukan..." : "Ajukan Peminjaman"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}