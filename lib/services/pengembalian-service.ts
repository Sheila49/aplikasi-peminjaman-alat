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
    const response = await api.post<ApiResponse<Pengembalian>>("/pengembalian", data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Pengembalian>): Promise<Pengembalian> => {
    const response = await api.put<ApiResponse<Pengembalian>>(`/pengembalian/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/pengembalian/${id}`)
  },
}
