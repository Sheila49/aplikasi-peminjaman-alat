"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Shield } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Modal } from "@/components/dashboard/modal"
import { kategoriService } from "@/lib/services/kategori-service"
import { kategoriSchema, type KategoriFormData } from "@/lib/validations"
import type { Kategori } from "@/lib/types"

export default function KategoriPage() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKategori, setEditingKategori] = useState<Kategori | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [alatCounts, setAlatCounts] = useState<Record<number, number>>({})

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KategoriFormData>({
    resolver: zodResolver(kategoriSchema),
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await kategoriService.getAll(page)
      setKategoriList(res.data)

      // Cek apakah ada pagination
      if (res.pagination && typeof res.pagination.totalPages === "number") {
        setTotalPages(res.pagination.totalPages)
      } else if ((res as any).totalPages) {
        setTotalPages((res as any).totalPages)
      } else {
        setTotalPages(1)
      }

      // ✅ Fetch jumlah alat untuk setiap kategori
      const counts: Record<number, number> = {}
      for (const kategori of res.data) {
        const count = await kategoriService.checkAlatCount(kategori.id)
        counts[kategori.id] = count
      }
      setAlatCounts(counts)
    } catch (error) {
      toast.error("Gagal memuat data kategori")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreateModal = () => {
    setEditingKategori(null)
    reset({ nama_kategori: "", deskripsi: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (kategori: Kategori) => {
    setEditingKategori(kategori)
    reset({
      nama_kategori: kategori.nama_kategori,
      deskripsi: kategori.deskripsi || "",
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: KategoriFormData) => {
    setIsSubmitting(true)
    try {
      if (editingKategori) {
        await kategoriService.update(editingKategori.id, data)
        toast.success("Kategori berhasil diperbarui")
      } else {
        await kategoriService.create(data)
        toast.success("Kategori berhasil ditambahkan")
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      const errorMessage = error.message || "Gagal menyimpan kategori"
      toast.error(errorMessage)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const kategori = kategoriList.find(k => k.id === id)
    if (!kategori) {
      toast.error("Kategori tidak ditemukan")
      return
    }

    const jumlahAlat = alatCounts[id] || 0

    // ✅ BLOKIR jika ada alat
    if (jumlahAlat > 0) {
      toast.error(
        `Kategori "${kategori.nama_kategori}" memiliki ${jumlahAlat} alat dan tidak dapat dihapus. Harap pindahkan atau hapus semua alat terlebih dahulu.`,
        { 
          duration: 6000,
          icon: "🚫",
          style: {
            maxWidth: '500px',
          }
        }
      )
      return
    }

    // Tampilkan konfirmasi untuk kategori kosong
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${kategori.nama_kategori}"?`)) {
      return
    }
    
    setIsDeleting(id)
    try {
      await kategoriService.delete(id)
      toast.success("Kategori berhasil dihapus")
      
      // Refresh data setelah berhasil hapus
      await fetchData()
    } catch (error: any) {
      console.error("Delete error detail:", error)
      
      // Extract error message
      const errorMessage = error.message || "Gagal menghapus kategori"
      
      // Tampilkan error dengan durasi lebih lama
      toast.error(errorMessage, { 
        duration: 6000,
        style: {
          maxWidth: '500px',
        }
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nama_kategori", label: "Nama Kategori" },
    {
      key: "deskripsi",
      label: "Deskripsi",
      render: (k: Kategori) => k.deskripsi || "-",
    },
    {
      key: "jumlah_alat",
      label: "Jumlah Alat",
      render: (k: Kategori) => {
        const jumlah = alatCounts[k.id] || 0
        return (
          <div className="flex items-center gap-2">
            <span className={jumlah > 0 ? "font-medium text-primary" : "text-muted-foreground"}>
              {jumlah}
            </span>
            {jumlah > 0 && (
              <span title="Kategori terlindungi">
                <Shield className="h-3.5 w-3.5 text-amber-500" />
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "actions",
      label: "Aksi",
      render: (kategori: Kategori) => {
        const jumlahAlat = alatCounts[kategori.id] || 0
        const hasAlat = jumlahAlat > 0
        const isCurrentlyDeleting = isDeleting === kategori.id
        
        return (
          <div className="flex gap-2">
            <button
              onClick={() => openEditModal(kategori)}
              disabled={isCurrentlyDeleting}
              className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(kategori.id)}
              disabled={isCurrentlyDeleting || hasAlat}
              className={`rounded-xl p-2 transition-all duration-300 ${
                hasAlat 
                  ? "text-muted-foreground/30 cursor-not-allowed opacity-50" 
                  : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              } disabled:opacity-50`}
              title={
                hasAlat 
                  ? `Tidak dapat dihapus: masih memiliki ${jumlahAlat} alat` 
                  : "Hapus"
              }
            >
              {isCurrentlyDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasAlat ? (
                <div className="relative" title={`Tidak dapat dihapus: masih memiliki ${jumlahAlat} alat`}>
                  <Trash2 className="h-4 w-4" />
                  <Shield className="h-2.5 w-2.5 text-amber-500 absolute -top-1 -right-1" />
                </div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <Header title="Manajemen Kategori" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Kategori</h2>
            <p className="mt-1 text-muted-foreground">Kelola kategori alat laboratorium</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 glow-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </button>
        </div>

        {/* ℹ️ INFO BOX */}
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">Perlindungan Data</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li className="flex items-center gap-1">
                  • Kategori dengan ikon <span className="inline-flex"><Shield className="h-3 w-3 text-amber-500" /></span> <strong>tidak dapat dihapus</strong> karena masih memiliki alat
                </li>
                <li>• Tombol hapus akan dinonaktifkan untuk kategori yang terlindungi</li>
                <li>• Pindahkan atau hapus semua alat terlebih dahulu untuk menghapus kategori</li>
              </ul>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={kategoriList}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingKategori ? "Edit Kategori" : "Tambah Kategori"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-card-foreground">
                Nama Kategori <span className="text-destructive">*</span>
              </label>
              <input
                {...register("nama_kategori")}
                placeholder="e.g., Alat Optik"
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.nama_kategori && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">
                  {errors.nama_kategori.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">
                Deskripsi
              </label>
              <textarea
                {...register("deskripsi")}
                rows={3}
                placeholder="Deskripsi kategori (opsional)"
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-2xl border border-border/50 px-5 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Menyimpan..." : (editingKategori ? "Simpan" : "Tambah")}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}