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

  // ✅ CEK JUMLAH ALAT di kategori tertentu
  checkAlatCount: async (kategoriId: number): Promise<number> => {
    try {
      // Ambil semua alat dengan filter kategori_id
      const response = await api.get(`/alat`, {
        params: { 
          kategori_id: kategoriId,
          limit: 1 // kita hanya perlu tahu ada atau tidak
        }
      })
      
      // Cek dari pagination.total atau data.length
      if (response.data?.pagination?.total !== undefined) {
        return response.data.pagination.total
      } else if (response.data?.data) {
        return response.data.data.length
      }
      
      return 0
    } catch (error) {
      console.error("Error checking alat count:", error)
      return 0
    }
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

  // Hapus kategori dengan pengecekan alat terlebih dahulu
  delete: async (id: number): Promise<void> => {
    try {
      // ✅ CEK DULU apakah ada alat di kategori ini
      const alatCount = await kategoriService.checkAlatCount(id)
      
      if (alatCount > 0) {
        throw new Error(`Kategori tidak dapat dihapus karena masih memiliki ${alatCount} alat. Harap pindahkan atau hapus semua alat terlebih dahulu.`)
      }
      
      // Jika tidak ada alat, lanjutkan hapus
      await api.delete(`/kategori/${id}`)
    } catch (error: any) {
      console.error("Delete kategori error:", error.response?.data || error)
      
      // Jika error sudah dari pengecekan kita, langsung throw
      if (error.message && error.message.includes("masih memiliki")) {
        throw error
      }
      
      // Extract error message dari backend
      let errorMessage = "Gagal menghapus kategori"
      
      if (error.response?.data) {
        const data = error.response.data
        
        if (data.message) {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.errors) {
          if (typeof data.errors === 'string') {
            errorMessage = data.errors
          } else if (Array.isArray(data.errors)) {
            errorMessage = data.errors.map((e: any) => e.message || e.msg || e).join(", ")
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  },
}