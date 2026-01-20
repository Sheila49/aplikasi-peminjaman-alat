import api from "@/lib/api"
import type { Kategori, ApiResponse, PaginatedResponse } from "@/lib/types"

export const kategoriService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Kategori>> => {
    const response = await api.get<PaginatedResponse<Kategori>>("/kategori", {
      params: { page, limit },
    })
    return response.data
  },

  getById: async (id: number): Promise<Kategori> => {
    const response = await api.get<ApiResponse<Kategori>>(`/kategori/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Kategori>): Promise<Kategori> => {
    const response = await api.post<ApiResponse<Kategori>>("/kategori", data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Kategori>): Promise<Kategori> => {
    const response = await api.put<ApiResponse<Kategori>>(`/kategori/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/kategori/${id}`)
  },
}
