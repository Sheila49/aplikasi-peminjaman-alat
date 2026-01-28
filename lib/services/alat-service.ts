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
    // Validasi dan konversi data dengan teliti
    const kategoriId = Number(data.kategori_id)
    const jumlahTotal = Number(data.jumlah_total)
    const jumlahTersedia = data.jumlah_tersedia ? Number(data.jumlah_tersedia) : jumlahTotal

    // Debug logging
    console.log("=== ALAT SERVICE CREATE DEBUG ===")
    console.log("1. Raw form data:", data)
    console.log("2. Converted values:", {
      kategoriId,
      jumlahTotal,
      jumlahTersedia,
      isKategoriValid: !isNaN(kategoriId) && kategoriId > 0,
      isJumlahValid: !isNaN(jumlahTotal) && jumlahTotal > 0,
    })

    // Validasi sebelum kirim
    if (!data.kode_alat || data.kode_alat.trim() === "") {
      throw new Error("Kode alat tidak boleh kosong")
    }

    if (!data.nama_alat || data.nama_alat.trim() === "") {
      throw new Error("Nama alat tidak boleh kosong")
    }

    if (isNaN(kategoriId) || kategoriId <= 0) {
      throw new Error("Kategori harus dipilih")
    }

    if (isNaN(jumlahTotal) || jumlahTotal <= 0) {
      throw new Error("Jumlah total harus lebih dari 0")
    }

    if (isNaN(jumlahTersedia) || jumlahTersedia < 0) {
      throw new Error("Jumlah tersedia tidak valid")
    }

    if (jumlahTersedia > jumlahTotal) {
      throw new Error("Jumlah tersedia tidak boleh lebih dari jumlah total")
    }

    // Validasi kondisi - backend expect lowercase
    const validKondisi = ["baik", "rusak ringan", "rusak berat"]
    const kondisiLowercase = data.kondisi.toLowerCase()
    if (!validKondisi.includes(kondisiLowercase)) {
      throw new Error(`Kondisi harus salah satu dari: ${validKondisi.join(", ")}`)
    }

    const payload = {
      kode_alat: data.kode_alat.trim(),
      nama_alat: data.nama_alat.trim(),
      kategori_id: kategoriId,
      jumlah_total: jumlahTotal,
      jumlah_tersedia: jumlahTersedia, // REQUIRED by backend
      kondisi: kondisiLowercase, // lowercase required
      // Field optional - hanya kirim jika ada nilai
      ...(data.lokasi_penyimpanan?.trim() && { lokasi_penyimpanan: data.lokasi_penyimpanan.trim() }),
      ...(data.deskripsi?.trim() && { deskripsi: data.deskripsi.trim() }),
      ...(data.gambar_url?.trim() && { gambar_url: data.gambar_url.trim() }),
    }

    console.log("3. Final payload:", payload)
    console.log("4. Payload types:", {
      kode_alat: typeof payload.kode_alat,
      nama_alat: typeof payload.nama_alat,
      kategori_id: typeof payload.kategori_id,
      jumlah_total: typeof payload.jumlah_total,
      jumlah_tersedia: typeof payload.jumlah_tersedia,
      kondisi: typeof payload.kondisi,
      kondisiValue: payload.kondisi,
    })

    try {
      const response = await api.post<ApiResponse<Alat>>("/alat", payload)
      console.log("5. Success response:", response.data)
      return response.data.data
    } catch (error: any) {
      console.error("=== ERROR DEBUG ===")
      console.error("6. Full error:", error)
      console.error("7. Error response:", error.response)
      console.error("8. Error response data:", JSON.stringify(error.response?.data, null, 2))
      console.error("8b. Error data keys:", Object.keys(error.response?.data || {}))
      console.error("8c. Error data errors:", error.response?.data?.errors)
      console.error("8d. Error data message:", error.response?.data?.message)
      console.error("9. Error response status:", error.response?.status)
      console.error("10. Error message:", error.message)
      
      let errorMessage = "Gagal menambahkan alat"
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        if (Array.isArray(error.response.data.errors)) {
          // Extract better error messages
          const messages = error.response.data.errors
            .map((err: any) => {
              const field = err.field || ''
              const msg = err.message || err.msg || JSON.stringify(err)
              return field ? `${field}: ${msg}` : msg
            })
            .filter(Boolean)
          errorMessage = messages.length > 0 ? messages.join("; ") : "Validasi gagal"
        } else if (typeof error.response.data.errors === 'object') {
          const errors = Object.entries(error.response.data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
            .join("; ")
          errorMessage = errors || "Validasi gagal"
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.error("11. Final error message:", errorMessage)
      
      // Throw dengan message yang jelas
      const enhancedError = new Error(errorMessage)
      ;(enhancedError as any).originalError = error
      throw enhancedError
    }
  },

  update: async (id: number, data: AlatFormData): Promise<Alat> => {
    const kategoriId = Number(data.kategori_id)
    const jumlahTotal = Number(data.jumlah_total)
    const jumlahTersedia = data.jumlah_tersedia ? Number(data.jumlah_tersedia) : jumlahTotal

    // Validasi sebelum kirim
    if (!data.kode_alat || data.kode_alat.trim() === "") {
      throw new Error("Kode alat tidak boleh kosong")
    }

    if (!data.nama_alat || data.nama_alat.trim() === "") {
      throw new Error("Nama alat tidak boleh kosong")
    }

    if (isNaN(kategoriId) || kategoriId <= 0) {
      throw new Error("Kategori harus dipilih")
    }

    if (isNaN(jumlahTotal) || jumlahTotal <= 0) {
      throw new Error("Jumlah total harus lebih dari 0")
    }

    if (isNaN(jumlahTersedia) || jumlahTersedia < 0) {
      throw new Error("Jumlah tersedia tidak valid")
    }

    if (jumlahTersedia > jumlahTotal) {
      throw new Error("Jumlah tersedia tidak boleh lebih dari jumlah total")
    }

    // Validasi kondisi - backend expect lowercase
    const validKondisi = ["baik", "rusak ringan", "rusak berat"]
    const kondisiLowercase = data.kondisi.toLowerCase()
    if (!validKondisi.includes(kondisiLowercase)) {
      throw new Error(`Kondisi harus salah satu dari: ${validKondisi.join(", ")}`)
    }

    // ✅ Build payload - kirim empty string atau skip field jika kosong
    const payload: any = {
      kode_alat: data.kode_alat.trim(),
      nama_alat: data.nama_alat.trim(),
      kategori_id: kategoriId,
      jumlah_total: jumlahTotal,
      jumlah_tersedia: jumlahTersedia,
      kondisi: kondisiLowercase, // lowercase
    }

    // ✅ Tambahkan optional fields hanya jika ada nilai
    const lokasiValue = data.lokasi_penyimpanan?.trim()
    if (lokasiValue) {
      payload.lokasi_penyimpanan = lokasiValue
    }

    const deskripsiValue = data.deskripsi?.trim()
    if (deskripsiValue) {
      payload.deskripsi = deskripsiValue
    }

    const gambarValue = data.gambar_url?.trim()
    if (gambarValue) {
      payload.gambar_url = gambarValue
    }

    console.log("=== UPDATE DEBUG ===")
    console.log("Update ID:", id)
    console.log("Update payload:", payload)

    try {
      const response = await api.put<ApiResponse<Alat>>(`/alat/${id}`, payload)
      console.log("Update success:", response.data)
      return response.data.data
    } catch (error: any) {
      console.error("=== UPDATE ERROR DEBUG ===")
      console.error("Full error:", error)
      console.error("Error response:", error.response)
      console.error("Error response data:", JSON.stringify(error.response?.data, null, 2))
      console.error("Error status:", error.response?.status)
      
      let errorMessage = "Gagal memperbarui alat"
      
      if (error.response?.data) {
        const data = error.response.data
        
        // Extract error message dari berbagai format
        if (data.message) {
          errorMessage = data.message
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.errors) {
          // Handle validation errors
          if (Array.isArray(data.errors)) {
            const messages = data.errors
              .map((err: any) => {
                const field = err.field || err.path || ''
                const msg = err.message || err.msg || JSON.stringify(err)
                return field ? `${field}: ${msg}` : msg
              })
              .filter(Boolean)
            errorMessage = messages.length > 0 ? messages.join("; ") : "Validasi gagal"
          } else if (typeof data.errors === 'object') {
            const errors = Object.entries(data.errors)
              .map(([field, msgs]) => {
                const msgStr = Array.isArray(msgs) ? msgs.join(", ") : String(msgs)
                return `${field}: ${msgStr}`
              })
              .join("; ")
            errorMessage = errors || "Validasi gagal"
          } else if (typeof data.errors === 'string') {
            errorMessage = data.errors
          }
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.error("Final error message:", errorMessage)
      throw new Error(errorMessage)
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/alat/${id}`)
    } catch (error: any) {
      console.error("Delete error:", error.response?.data)
      
      let errorMessage = "Gagal menghapus alat"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  },
}