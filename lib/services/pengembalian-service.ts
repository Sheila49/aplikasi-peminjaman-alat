import api from "@/lib/api"
import type { Pengembalian, ApiResponse, PaginatedResponse } from "@/lib/types"

export const pengembalianService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Pengembalian>> => {
    const response = await api.get<PaginatedResponse<Pengembalian>>("/pengembalian", {
      params: { page, limit },
    })
    return response.data
  },

  getById: async (id: number): Promise<Pengembalian> => {
    const response = await api.get<ApiResponse<Pengembalian>>(`/pengembalian/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Pengembalian>): Promise<Pengembalian> => {
  const payload = {
  peminjaman_id: Number(data.peminjaman_id),
  tanggal_kembali_aktual: new Date().toISOString(), // atau .split("T")[0] kalau backend minta date
  kondisi_alat: data.kondisi_alat,
  jumlah_dikembalikan: Number(data.jumlah_dikembalikan ?? 1),
  keterlambatan_hari: Number(data.keterlambatan_hari ?? 0),
  denda: Number(data.denda ?? 0),
  catatan: data.catatan || "",
  diterima_oleh: Number(data.diterima_oleh), // jangan lupa ini!
}

    console.log("Payload pengembalian:", payload)

    const response = await api.post<ApiResponse<Pengembalian>>("/pengembalian", payload)
    return response.data.data
  },

  update: async (id: number, data: Partial<Pengembalian>): Promise<Pengembalian> => {
    const payload = {
      peminjaman_id: data.peminjaman_id,
      tanggal_kembali_aktual: data.tanggal_kembali_aktual,
      kondisi_alat: data.kondisi_alat,
      catatan: data.catatan || "",
    }

    const response = await api.put<ApiResponse<Pengembalian>>(`/pengembalian/${id}`, payload)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/pengembalian/${id}`)
  },
}