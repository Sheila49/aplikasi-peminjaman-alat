"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Package, ClipboardList, Loader2, Sparkles } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAlat, setSelectedAlat] = useState<Alat | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      tanggal_pinjam: getTodayDate(), // Dinamis mengikuti hari ini
      tanggal_kembali: "",
      catatan: "",
    }
  })

  const formValues = watch()
  
  useEffect(() => {
    console.log("Form values:", formValues)
    console.log("Form errors:", errors)
  }, [formValues, errors])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await alatService.getAll(1, 100)
      setAlatList(res.data.filter((a) => a.jumlah_tersedia > 0))
    } catch (error) {
      toast.error("Gagal memuat data alat")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openPinjamModal = (alat: Alat) => {
    console.log("Opening modal for alat:", alat)
    setSelectedAlat(alat)
    
    // Reset form dengan tanggal hari ini yang FRESH (real-time)
    const todayDate = getTodayDate()
    reset({
      alat_id: alat.id,
      jumlah_pinjam: 1,
      tanggal_pinjam: todayDate,
      tanggal_kembali: "",
      catatan: "",
    })
    
    // Set alat_id dan tanggal_pinjam
    setValue("alat_id", alat.id, { 
      shouldValidate: true,
      shouldDirty: true 
    })
    
    setValue("tanggal_pinjam", todayDate, {
      shouldValidate: true,
      shouldDirty: true
    })
    
    setIsModalOpen(true)
  }

  const onSubmit = async (data: PeminjamanFormData) => {
    console.log("=== FORM SUBMIT DEBUG ===")
    console.log("1. Raw form data:", data)
    console.log("2. User:", user)
    console.log("3. Selected alat:", selectedAlat)
    
    if (!user?.id) {
      toast.error("User tidak ditemukan. Silakan login kembali.")
      return
    }

    if (!data.alat_id) {
      toast.error("Alat ID tidak valid")
      console.error("alat_id is missing or invalid:", data.alat_id)
      return
    }

    if (data.jumlah_pinjam < 1 || data.jumlah_pinjam > (selectedAlat?.jumlah_tersedia || 0)) {
      toast.error(`Jumlah harus antara 1 dan ${selectedAlat?.jumlah_tersedia}`)
      return
    }

    if (!data.tanggal_pinjam || !data.tanggal_kembali) {
      toast.error("Tanggal pinjam dan kembali harus diisi")
      return
    }

    if (new Date(data.tanggal_kembali) <= new Date(data.tanggal_pinjam)) {
      toast.error("Tanggal kembali harus setelah tanggal pinjam")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, any> = {
        alat_id: Number(data.alat_id),
        jumlah_pinjam: Number(data.jumlah_pinjam),
        tanggal_kembali_rencana: data.tanggal_kembali,
      }

      if (data.catatan?.trim()) {
        payload.keperluan = data.catatan.trim()
      }

      console.log("4. Payload to send:", payload)
      const result = await peminjamanService.create(payload)
      console.log("6. API success response:", result)

      toast.success("Pengajuan peminjaman berhasil!")
      setIsModalOpen(false)
      reset()
      fetchData()
    } catch (err) {
      const error: any = err
      console.error("=== ERROR DEBUG ===")
      try { console.error("Full error object:", JSON.stringify(error, null, 2)) } catch { console.error("Full error object:", error) }
      try { console.error("Error response (data):", JSON.stringify(error?.response?.data, null, 2)) } catch { console.error("Error response:", error?.response) }
      if (error?.request?.responseText) console.error("Raw responseText:", error.request.responseText)

      const respData = error?.response?.data || (error?.request?.responseText ? (() => { try { return JSON.parse(error.request.responseText) } catch { return null } })() : null)
      let errorMessage = "Gagal mengajukan peminjaman"

      if (respData?.errors && Array.isArray(respData.errors)) {
        const msgs: string[] = []
        respData.errors.forEach((item: any) => {
          if (!item) return
          if (typeof item === "string") {
            msgs.push(item)
          } else if (item.message || item.msg) {
            const message = item.message ?? item.msg
            msgs.push(message)
            const fieldName = item.field ?? item.param ?? item.key
            if (fieldName) {
              try { setError(fieldName as any, { type: "server", message }) } catch {}
            }
          } else if (typeof item === "object") {
            if (item.field && item.errors) {
              const msg = Array.isArray(item.errors) ? item.errors.join(", ") : String(item.errors)
              msgs.push(`${item.field}: ${msg}`)
              try { setError(item.field as any, { type: "server", message: msg }) } catch {}
            } else {
              try { msgs.push(JSON.stringify(item)) } catch { msgs.push(String(item)) }
            }
          } else {
            msgs.push(String(item))
          }
        })
        if (msgs.length) errorMessage = msgs.join("; ")
      } else if (respData?.errors && typeof respData.errors === "object") {
        const mapped: string[] = []
        Object.entries(respData.errors).forEach(([field, val]) => {
          const msg = Array.isArray(val) ? val.join(", ") : String(val)
          mapped.push(`${field}: ${msg}`)
          try { setError(field as any, { type: "server", message: msg }) } catch {}
        })
        if (mapped.length) errorMessage = mapped.join("; ")
      } else if (respData?.message) {
        errorMessage = respData.message
      } else if (respData?.error) {
        errorMessage = respData.error
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormError = (errors: any) => {
    console.log("Form validation errors:", errors)
    
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error(firstError.message)
    }
  }

  return (
    <>
      <Header title="Daftar Alat" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Alat Tersedia</h2>
          <p className="mt-1 text-muted-foreground">Pilih alat yang ingin dipinjam</p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl glass">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          </div>
        ) : alatList.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl glass">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Tidak ada alat tersedia</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {alatList.map((alat, index) => (
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
                  <p className="mb-3 text-sm text-muted-foreground">{alat.kategori?.nama_kategori || "Tanpa Kategori"}</p>
                  <div className="mb-5 flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Stok: <span className="font-semibold text-card-foreground">{alat.jumlah_tersedia}</span>
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        alat.kondisi === "Baik" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
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

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajukan Peminjaman">
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

            <input 
              type="hidden" 
              {...register("alat_id", { 
                valueAsNumber: true,
                required: "Alat ID harus ada"
              })} 
            />

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
                <label className="text-sm font-medium text-card-foreground">
                  Tanggal Pinjam *
                  <span className="ml-1 text-xs text-muted-foreground">(pengambilan)</span>
                </label>
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
                  {...register("tanggal_kembali")}
                  type="date"
                  min={formValues.tanggal_pinjam || getTodayDate()}
                  className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                />
                {errors.tanggal_kembali && (
                  <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.tanggal_kembali.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">Keperluan Peminjaman (opsional)</label>
              <textarea
                {...register("catatan")}
                rows={2}
                placeholder="Untuk praktikum, penelitian, dll..."
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
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