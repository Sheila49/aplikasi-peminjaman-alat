import api from "@/lib/api"
import type { Alat, ApiResponse, PaginatedResponse } from "@/lib/types"

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

  create: async (data: Partial<Alat>): Promise<Alat> => {
    const response = await api.post<ApiResponse<Alat>>("/alat", data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Alat>): Promise<Alat> => {
    const response = await api.put<ApiResponse<Alat>>(`/alat/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/alat/${id}`)
  },
}
