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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PeminjamanFormData>({
    resolver: zodResolver(peminjamanSchema),
  })

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
    setSelectedAlat(alat)
    setValue("alat_id", alat.id)
    reset({
      alat_id: alat.id,
      jumlah: 1,
      tanggal_pinjam: new Date().toISOString().split("T")[0],
      tanggal_kembali: "",
      catatan: "",
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: PeminjamanFormData) => {
    if (!user?.id) return
    setIsSubmitting(true)
    try {
      await peminjamanService.create({
        ...data,
        user_id: user.id,
        status: "diajukan",
      })
      toast.success("Pengajuan peminjaman berhasil!")
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Gagal mengajukan peminjaman")
      console.error(error)
    } finally {
      setIsSubmitting(false)
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
                {/* Gradient overlay on hover */}
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <input type="hidden" {...register("alat_id", { valueAsNumber: true })} />

            <div>
              <label className="text-sm font-medium text-card-foreground">Jumlah</label>
              <input
                {...register("jumlah", { valueAsNumber: true })}
                type="number"
                min={1}
                max={selectedAlat?.jumlah_tersedia || 1}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.jumlah && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.jumlah.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-card-foreground">Tanggal Pinjam</label>
                <input
                  {...register("tanggal_pinjam")}
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]} // ✅ default hari ini
                  className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                />
                {errors.tanggal_pinjam && (
                  <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.tanggal_pinjam.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground">Tanggal Kembali</label>
                <input
                  {...register("tanggal_kembali")}
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                />
                {errors.tanggal_kembali && (
                  <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.tanggal_kembali.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">Catatan (opsional)</label>
              <textarea
                {...register("catatan")}
                rows={2}
                placeholder="Keperluan peminjaman..."
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border border-border/50 px-5 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-50 glow-primary"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Ajukan Peminjaman
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
