import api from "@/lib/api"
import type { Peminjaman, ApiResponse, PaginatedResponse } from "@/lib/types"

export const peminjamanService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Peminjaman>> => {
    const response = await api.get<PaginatedResponse<Peminjaman>>("/peminjaman", {
      params: { page, limit },
    })
    return response.data
  },

  getByUser: async (page = 1, limit = 10): Promise<PaginatedResponse<Peminjaman>> => {
    const response = await api.get<PaginatedResponse<Peminjaman>>("/peminjaman/user", {
      params: { page, limit },
    })
    return response.data
  },

  getById: async (id: number): Promise<Peminjaman> => {
    const response = await api.get<ApiResponse<Peminjaman>>(`/peminjaman/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Peminjaman>): Promise<Peminjaman> => {
    try {
      const response = await api.post<ApiResponse<Peminjaman>>("/peminjaman", data, {
        validateStatus: () => true,
      })
      if (response.status >= 400) {
        const err: any = new Error(`Request failed with status ${response.status}`)
        err.response = { data: response.data, status: response.status }
        throw err
      }
      return response.data.data
    } catch (err) {
      const error: any = err
      console.error("peminjaman.create - full error:", error)
      throw err
    }
  },

  update: async (id: number, data: Partial<Peminjaman>): Promise<Peminjaman> => {
    const response = await api.put<ApiResponse<Peminjaman>>(`/peminjaman/${id}`, data)
    return response.data.data
  },

  approve: async (id: number, catatan?: string): Promise<Peminjaman> => {
    const response = await api.patch<ApiResponse<Peminjaman>>(`/peminjaman/${id}/approve`, {
      catatan_persetujuan: catatan,
    })
    return response.data.data
  },

  reject: async (id: number, catatan?: string): Promise<Peminjaman> => {
    const response = await api.patch<ApiResponse<Peminjaman>>(`/peminjaman/${id}/reject`, {
      catatan_persetujuan: catatan,
    })
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/peminjaman/${id}`)
  },
}