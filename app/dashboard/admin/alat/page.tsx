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

  /* ================= MODAL ================= */
  const openCreateModal = () => {
    setEditingAlat(null)
    reset({
  kode_alat: "",
  nama_alat: "",
  kategori_id: undefined,
  jumlah_total: 1,
  jumlah_tersedia: 1,
  kondisi: "Baik", // sesuaikan casing dengan DB
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
    lokasi_penyimpanan: alat.lokasi_penyimpanan ?? "",
    deskripsi: alat.deskripsi ?? "",
    gambar_url: alat.gambar_url ?? "",
  })
  setIsModalOpen(true)
}

  /* ================= SUBMIT ================= */
  const onSubmit = async (data: AlatFormData) => {
  console.log("DATA FORM:", data)

  const payload = {
    ...data,
    jumlah_tersedia: data.jumlah_total, // ⬅️ INI KUNCI NYAWA
  }

  console.log("PAYLOAD KE BACKEND:", payload)

  setIsSubmitting(true)
  try {
    if (editingAlat) {
      await alatService.update(editingAlat.id, payload)
      toast.success("Alat berhasil diperbarui")
    } else {
      await alatService.create(payload)
      toast.success("Alat berhasil ditambahkan")
    }
    setIsModalOpen(false)
    fetchData()
  } catch (error) {
    console.error("AXIOS ERROR:", error)
    toast.error("Gagal menyimpan alat")
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
      render: (alat: Alat) => (
        <span
  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
    alat.kondisi === "Baik"
      ? "bg-primary/20 text-primary"
      : "bg-destructive/20 text-destructive"
  }`}
>
  {alat.kondisi
    .split(" ")
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ")}
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
            className="rounded-xl p-2 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(alat.id)}
            className="rounded-xl p-2 hover:bg-destructive/10 hover:text-destructive"
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
    <Header title="Manajemen Alat" />

    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daftar Alat</h2>
          <p className="text-muted-foreground">Kelola inventaris alat</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Kode & Nama Alat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Kode Alat</label>
              <input
                {...register("kode_alat")}
                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.kode_alat && (
                <p className="text-xs text-destructive">{errors.kode_alat.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Nama Alat</label>
              <input
                {...register("nama_alat")}
                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.nama_alat && (
                <p className="text-xs text-destructive">{errors.nama_alat.message}</p>
              )}
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="text-sm font-medium">Kategori</label>
            <select
              {...register("kategori_id", { valueAsNumber: true })}
              defaultValue={0}
              className="w-full rounded-lg border-2 border-gray-300 px-3 py-2"
            >
              <option value={0} disabled>Pilih Kategori</option>
              {kategoriList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kategori}</option>
              ))}
            </select>
            {errors.kategori_id && (
              <p className="text-xs text-destructive">{errors.kategori_id.message}</p>
            )}
          </div>

          {/* Jumlah */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Jumlah Total</label>
              <input
                type="number"
                {...register("jumlah_total", { valueAsNumber: true })}
                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah Tersedia</label>
              <input
                type="number"
                {...register("jumlah_tersedia", { valueAsNumber: true })}
                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Kondisi */}
          <div>
            <label className="text-sm font-medium">Kondisi</label>
            <select
              {...register("kondisi")}
              defaultValue="Baik"
              className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          {/* Deskripsi & Gambar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <textarea
                {...register("deskripsi")}
                rows={3}
                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL Gambar</label>
              <input
                {...register("gambar_url")}
                className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="text-sm font-medium">Lokasi Penyimpanan</label>
            <input
              {...register("lokasi_penyimpanan")}
              className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border-2 border-gray-300 px-4 py-2 text-sm hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  </>
)
}