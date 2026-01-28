import api from '@/lib/api'
import { useAuthStore } from "@/store/auth-store"
import type { Peminjaman } from '@/lib/types'

interface PaginatedResponse {
  data: Peminjaman[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export const peminjamanService = {
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
    const response = await api.get(`/peminjaman?page=${page}&limit=${limit}`)
    return response.data?.data ? response.data : response.data
  },

  async getById(id: number): Promise<Peminjaman> {
    const response = await api.get(`/peminjaman/${id}`)
    return response.data?.data ? response.data.data : response.data
  },

  async create(peminjaman: Partial<Peminjaman>): Promise<Peminjaman> {
    const response = await api.post('/peminjaman', peminjaman)
    return response.data?.data ? response.data.data : response.data
  },

  async update(id: number, peminjaman: Partial<Peminjaman>): Promise<Peminjaman> {
    const response = await api.put(`/peminjaman/${id}`, peminjaman)
    return response.data?.data ? response.data.data : response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/peminjaman/${id}`)
  },

  async approve(id: number): Promise<Peminjaman> {
    const response = await api.patch(`/peminjaman/${id}/approve`)
    return response.data?.data ? response.data.data : response.data
  },

  // ✅ UPDATED: Menambahkan parameter keterangan_penolakan
  async reject(id: number, keterangan: string) {
  const response = await api.patch(`/peminjaman/${id}/reject`, {
    catatan_persetujuan: keterangan  // ✅ Sesuai dengan backend
  })
  return response.data
},

  async markAsDipinjam(id: number): Promise<Peminjaman> {
    const response = await api.patch(`/peminjaman/${id}/dipinjam`)
    return response.data?.data ? response.data.data : response.data
  },

  async markAsDikembalikan(id: number): Promise<Peminjaman> {
    const response = await api.patch(`/peminjaman/${id}/dikembalikan`)
    return response.data?.data ? response.data.data : response.data
  },

  async getByUser(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
    try {
      const response = await api.get(`/peminjaman/user?page=${page}&limit=${limit}`)
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data
      } else if (Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: response.data.length,
            itemsPerPage: limit
          }
        }
      } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        return response.data.data
      }
      
      console.warn('⚠️ Unexpected response structure:', response.data)
      return {
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      }
    } catch (error) {
      console.error('❌ getByUser error:', error)
      throw error
    }
  },

  async getStatistics(): Promise<any> {
    const response = await api.get('/peminjaman/statistics')
    return response.data?.data ? response.data.data : response.data
  },

  async setDipinjam(id: number): Promise<Peminjaman> {
    const token = useAuthStore.getState().token
    const response = await api.patch(`/peminjaman/${id}/dipinjam`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data?.data ? response.data.data : response.data
  },
}