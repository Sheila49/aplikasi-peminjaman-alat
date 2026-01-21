"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
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

    // cek apakah ada pagination
    if (res.pagination && typeof res.pagination.totalPages === "number") {
      setTotalPages(res.pagination.totalPages)
    } else if ((res as any).totalPages) {
      // fallback kalau backend kirim totalPages langsung
      setTotalPages((res as any).totalPages)
    } else {
      // default kalau tidak ada info totalPages
      setTotalPages(1)
    }
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
    reset({ nama_kategori: "", deskripsi: "" }) // ✅ perbaikan
    setIsModalOpen(true)
  }

  const openEditModal = (kategori: Kategori) => {
    setEditingKategori(kategori)
    reset({
      nama_kategori: kategori.nama_kategori, // ✅ perbaikan
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
    } catch (error) {
      toast.error("Gagal menyimpan kategori")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return
    try {
      await kategoriService.delete(id)
      toast.success("Kategori berhasil dihapus")
      fetchData()
    } catch (error) {
      toast.error("Gagal menghapus kategori")
      console.error(error)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "nama_kategori", label: "Nama Kategori" }, // ✅ perbaikan
    {
      key: "deskripsi",
      label: "Deskripsi",
      render: (k: Kategori) => k.deskripsi || "-",
    },
    {
      key: "actions",
      label: "Aksi",
      render: (kategori: Kategori) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(kategori)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(kategori.id)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Header title="Manajemen Kategori" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Kategori</h2>
            <p className="mt-1 text-muted-foreground">Kelola kategori alat</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 glow-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Kategori
          </button>
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
                Nama Kategori
              </label>
              <input
                {...register("nama_kategori")} // ✅ perbaikan
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
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
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
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
                {editingKategori ? "Simpan" : "Tambah"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}