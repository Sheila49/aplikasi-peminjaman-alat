"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Modal } from "@/components/dashboard/modal"
import { alatService } from "@/lib/services/alat-service"
import { kategoriService } from "@/lib/services/kategori-service"
import { alatSchema, type AlatFormData } from "@/lib/validations"
import type { Alat, Kategori } from "@/lib/types"

export default function AlatPage() {
  const [alatList, setAlatList] = useState<Alat[]>([])
  const [kategoriList, setKategoriList] = useState<Kategori[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlat, setEditingAlat] = useState<Alat | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlatFormData>({
    resolver: zodResolver(alatSchema),
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [alatRes, kategoriRes] = await Promise.all([alatService.getAll(page), kategoriService.getAll(1, 100)])
      setAlatList(alatRes.data)
      setTotalPages(alatRes.totalPages)
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

  const openCreateModal = () => {
    setEditingAlat(null)
    reset({ nama: "", kategori_id: 0, stok: 0, kondisi: "", deskripsi: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (alat: Alat) => {
    setEditingAlat(alat)
    reset({
      nama: alat.nama,
      kategori_id: alat.kategori_id,
      stok: alat.stok,
      kondisi: alat.kondisi,
      deskripsi: alat.deskripsi || "",
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: AlatFormData) => {
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
      fetchData()
    } catch (error) {
      toast.error("Gagal menyimpan alat")
      console.error(error)
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

  const columns = [
    { key: "id", label: "ID" },
    { key: "nama", label: "Nama Alat" },
    {
      key: "kategori",
      label: "Kategori",
      render: (alat: Alat) => alat.kategori?.nama || "-",
    },
    { key: "stok", label: "Stok" },
    {
      key: "kondisi",
      label: "Kondisi",
      render: (alat: Alat) => (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            alat.kondisi === "Baik" ? "bg-primary/20 text-primary glow-primary" : "bg-destructive/20 text-destructive"
          }`}
        >
          {alat.kondisi}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (alat: Alat) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(alat)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(alat.id)}
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
      <Header title="Manajemen Alat" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Alat</h2>
            <p className="mt-1 text-muted-foreground">Kelola inventaris alat</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 glow-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Alat
          </button>
        </div>

        <DataTable
          columns={columns}
          data={alatList}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingAlat ? "Edit Alat" : "Tambah Alat"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-card-foreground">Nama Alat</label>
              <input
                {...register("nama")}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.nama && <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.nama.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">Kategori</label>
              <select
                {...register("kategori_id", { valueAsNumber: true })}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              >
                <option value={0}>Pilih Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
              {errors.kategori_id && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.kategori_id.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-card-foreground">Stok</label>
                <input
                  {...register("stok", { valueAsNumber: true })}
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                />
                {errors.stok && <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.stok.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-card-foreground">Kondisi</label>
                <select
                  {...register("kondisi")}
                  className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
                >
                  <option value="">Pilih Kondisi</option>
                  <option value="Baik">Baik</option>
                  <option value="Rusak Ringan">Rusak Ringan</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
                {errors.kondisi && (
                  <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.kondisi.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">Deskripsi</label>
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
                {editingAlat ? "Simpan" : "Tambah"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
