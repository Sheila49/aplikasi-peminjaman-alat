"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { RotateCcw, Loader2, Calendar, Package } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Modal } from "@/components/dashboard/modal"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { pengembalianSchema, type PengembalianFormData } from "@/lib/validations"
import { useAuthStore } from "@/store/auth-store"
import type { Peminjaman } from "@/lib/types"
import axios from "axios"

export default function PeminjamPengembalianPage() {
  const { user } = useAuthStore()
  const [approvedPeminjaman, setApprovedPeminjaman] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PengembalianFormData>({
    resolver: zodResolver(pengembalianSchema),
  })

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const res = await peminjamanService.getByUser(user.id, 1, 100)
      const filtered = res.data.filter((p) => p.status === "disetujui")
      setApprovedPeminjaman(filtered)
    } catch (error) {
      toast.error("Gagal memuat data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openReturnModal = (peminjaman: Peminjaman) => {
    setSelectedPeminjaman(peminjaman)
    reset({
      peminjaman_id: peminjaman.id,
      kondisi_alat: "",
      jumlah_dikembalikan: 1,
      catatan: "",
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: PengembalianFormData) => {
    if (!user?.id || !selectedPeminjaman) {
      toast.error("Data tidak valid")
      return
    }

    // Validasi
    const jumlahDikembalikan = Number(data.jumlah_dikembalikan)
    const jumlahPinjam = Number(selectedPeminjaman.jumlah_pinjam)

    if (!data.kondisi_alat?.trim()) {
      toast.error("Kondisi alat harus dipilih")
      return
    }

    if (isNaN(jumlahDikembalikan) || jumlahDikembalikan <= 0) {
      toast.error("Jumlah dikembalikan harus lebih dari 0")
      return
    }

    if (jumlahDikembalikan > jumlahPinjam) {
      toast.error(`Jumlah dikembalikan tidak boleh melebihi ${jumlahPinjam}`)
      return
    }

    setIsSubmitting(true)

    try {
      // Buat payload dengan HANYA field yang diperbolehkan
      const payload: any = {
        peminjaman_id: Number(selectedPeminjaman.id),
        kondisi_alat: data.kondisi_alat.trim().toLowerCase(),
        jumlah_dikembalikan: jumlahDikembalikan,
      }

      // HANYA tambahkan catatan jika tidak kosong
      if (data.catatan && data.catatan.trim() !== "") {
        payload.catatan = data.catatan.trim()
      }

      console.log("✅ Final payload (only allowed fields):", payload)

      // Get token
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"

      // Call API directly to avoid service layer adding extra fields
      const response = await axios.post(`${baseURL}/pengembalian`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      console.log("✅ Response:", response.data)
      
      toast.success("Pengembalian berhasil dicatat!")
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
        } else if (typeof errorData === 'string') {
          errorMsg = errorData
        }
        
        toast.error(errorMsg)
      } else if (error?.response?.status === 404) {
        toast.error("Data peminjaman tidak ditemukan")
      } else if (error?.response?.status === 409) {
        toast.error("Alat sudah dikembalikan sebelumnya")
      } else {
        const errorMsg = error?.response?.data?.message || error?.message || "Gagal melakukan pengembalian"
        toast.error(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header title="Pengembalian Alat" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Alat yang Sedang Dipinjam</h2>
          <p className="mt-1 text-muted-foreground">Kembalikan alat yang sudah selesai digunakan</p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl glass">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          </div>
        ) : approvedPeminjaman.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl glass">
            <RotateCcw className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Tidak ada alat yang perlu dikembalikan</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {approvedPeminjaman.map((peminjaman, index) => (
              <div
                key={peminjaman.id}
                className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-accent/5 to-transparent" />

                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-accent glow-accent">
                    <Package className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-card-foreground">{peminjaman.alat?.nama_alat}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Jumlah: {peminjaman.jumlah_pinjam}</p>
                  <div className="mb-5 space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Tgl Pinjam:{" "}
                      <span className="text-card-foreground">
                        {peminjaman.tanggal_pinjam
                          ? new Date(peminjaman.tanggal_pinjam).toLocaleDateString("id-ID")
                          : "-"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Batas Kembali:{" "}
                      <span className="text-card-foreground">
                        {peminjaman.tanggal_kembali_rencana
                          ? new Date(peminjaman.tanggal_kembali_rencana).toLocaleDateString("id-ID")
                          : "-"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => openReturnModal(peminjaman)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-accent py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-accent/25 glow-accent"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Kembalikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pengembalian Alat">
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
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">
                Jumlah Dikembalikan <span className="text-destructive">*</span>
                <span className="ml-1 text-xs text-muted-foreground">(Maks: {selectedPeminjaman?.jumlah_pinjam || 0})</span>
              </label>
              <input
                type="number"
                min={1}
                max={selectedPeminjaman?.jumlah_pinjam ?? 1}
                {...register("jumlah_dikembalikan", { 
                  valueAsNumber: true,
                  required: "Jumlah dikembalikan harus diisi",
                  min: { value: 1, message: "Minimal 1" },
                  max: { 
                    value: selectedPeminjaman?.jumlah_pinjam ?? 1, 
                    message: `Maksimal ${selectedPeminjaman?.jumlah_pinjam || 1}` 
                  }
                })}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                placeholder="Masukkan jumlah"
              />
              {errors.jumlah_dikembalikan && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">
                  {errors.jumlah_dikembalikan.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">Catatan (opsional)</label>
              <textarea
                {...register("catatan")}
                rows={3}
                placeholder="Tambahkan catatan jika ada kerusakan atau hal lain yang perlu diperhatikan..."
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
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
        </Modal>
      </div>
    </>
  )
}