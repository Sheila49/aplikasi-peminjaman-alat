import api from "@/lib/api"
import type { Peminjaman, ApiResponse, PaginatedResponse } from "@/lib/types"

export const peminjamanService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Peminjaman>> => {
    const response = await api.get<PaginatedResponse<Peminjaman>>("/peminjaman", {
      params: { page, limit },
    })
    return response.data
  },

  getByUser: async (userId: number, page = 1, limit = 10): Promise<PaginatedResponse<Peminjaman>> => {
    const response = await api.get<PaginatedResponse<Peminjaman>>(`/peminjaman/user/${userId}`, {
      params: { page, limit },
    })
    return response.data
  },

  getById: async (id: number): Promise<Peminjaman> => {
    const response = await api.get<ApiResponse<Peminjaman>>(`/peminjaman/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Peminjaman>): Promise<Peminjaman> => {
    console.log("Payload dikirim:", data) // debug
    const response = await api.post<ApiResponse<Peminjaman>>("/peminjaman", data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Peminjaman>): Promise<Peminjaman> => {
    const response = await api.put<ApiResponse<Peminjaman>>(`/peminjaman/${id}`, data)
    return response.data.data
  },

  approve: async (id: number): Promise<Peminjaman> => {
    const response = await api.patch<ApiResponse<Peminjaman>>(`/peminjaman/${id}/approve`)
    return response.data.data
  },

  reject: async (id: number): Promise<Peminjaman> => {
    const response = await api.patch<ApiResponse<Peminjaman>>(`/peminjaman/${id}/reject`)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/peminjaman/${id}`)
  },
}
