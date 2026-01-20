import type { Alat, ApiResponse, PaginatedResponse } from "@/lib/types"
import type { AlatFormData } from "@/lib/validations"
import api from "@/lib/api"

export const alatService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Alat>> => {
    const response = await api.get<PaginatedResponse<Alat>>("/alat", {
      params: { page, limit },
    })
    return response.data
  },

  getById: async (id: number): Promise<Alat> => {
    const response = await api.get<ApiResponse<Alat>>(`/alat/${id}`)
    return response.data.data
  },

  create: async (data: AlatFormData): Promise<Alat> => {
  const payload = {
    kode_alat: data.kode_alat,
    nama_alat: data.nama_alat,
    kategori_id: data.kategori_id,
    jumlah_total: data.jumlah_total,
    jumlah_tersedia: data.jumlah_tersedia ?? data.jumlah_total,
    kondisi: data.kondisi, // pastikan casing sesuai DB
    lokasi_penyimpanan: data.lokasi_penyimpanan || "",
    deskripsi: data.deskripsi || "",
    gambar_url: data.gambar_url || "",
  }

  console.log("Payload create alat:", JSON.stringify(payload, null, 2))
  
  const response = await api.post<ApiResponse<Alat>>("/alat", payload)
  return response.data.data
},

update: async (id: number, data: AlatFormData): Promise<Alat> => {
  const payload = {
    kode_alat: data.kode_alat,
    nama_alat: data.nama_alat,
    kategori_id: data.kategori_id,
    jumlah_total: data.jumlah_total,
    jumlah_tersedia: data.jumlah_tersedia ?? data.jumlah_total,
    kondisi: data.kondisi,
    lokasi_penyimpanan: data.lokasi_penyimpanan || null,
    deskripsi: data.deskripsi || null,
    gambar_url: data.gambar_url || null,
  }

  const response = await api.put<ApiResponse<Alat>>(`/alat/${id}`, payload)
  return response.data.data
},

  delete: async (id: number): Promise<void> => {
    await api.delete(`/alat/${id}`)
  },
}
