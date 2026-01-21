// lib/services/report-service.ts
import api from "@/lib/api"

export const laporanService = {
  // Download PDF Report
  getPeminjamanReport: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const params: any = {}
    if (startDate) params.start = startDate
    if (endDate) params.end = endDate

    const response = await api.get("/laporan/peminjaman", {
      params,
      responseType: 'blob'
    })
    
    return response.data
  },

  // Get JSON data for Excel
  getPeminjamanData: async (startDate?: string, endDate?: string) => {
    const params: any = {}
    if (startDate) params.start = startDate
    if (endDate) params.end = endDate

    const response = await api.get("/laporan/peminjaman", { params })
    return response.data
  },

  // Get Pengembalian Report
  getPengembalianReport: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const params: any = {}
    if (startDate) params.start = startDate
    if (endDate) params.end = endDate

    const response = await api.get("/laporan/pengembalian", {
      params,
      responseType: 'blob'
    })
    
    return response.data
  },

  getPengembalianData: async (startDate?: string, endDate?: string) => {
    const params: any = {}
    if (startDate) params.start = startDate
    if (endDate) params.end = endDate

    const response = await api.get("/laporan/pengembalian", { params })
    return response.data
  }
}