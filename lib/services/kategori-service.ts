import api from "@/lib/api"
import type { Kategori, ApiResponse, PaginatedResponse } from "@/lib/types"
import type { KategoriFormData } from "@/lib/validations"

export const kategoriService = {
  // Ambil semua kategori dengan pagination
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Kategori>> => {
    const response = await api.get<PaginatedResponse<Kategori>>("/kategori", {
      params: { page, limit },
    })
    return response.data
  },

  // Ambil kategori berdasarkan ID
  getById: async (id: number): Promise<Kategori> => {
    const response = await api.get<ApiResponse<Kategori>>(`/kategori/${id}`)
    return response.data.data
  },

  // Buat kategori baru
  create: async (data: KategoriFormData): Promise<Kategori> => {
    const payload = {
      nama_kategori: data.nama_kategori,
      deskripsi: data.deskripsi || "",
    }

    const response = await api.post<ApiResponse<Kategori>>("/kategori", payload)
    return response.data.data
  },

  // Update kategori
  update: async (id: number, data: KategoriFormData): Promise<Kategori> => {
    const payload = {
      nama_kategori: data.nama_kategori,
      deskripsi: data.deskripsi || "",
    }

    const response = await api.put<ApiResponse<Kategori>>(`/kategori/${id}`, payload)
    return response.data.data
  },

  // Hapus kategori
  delete: async (id: number): Promise<void> => {
    await api.delete(`/kategori/${id}`)
  },
}