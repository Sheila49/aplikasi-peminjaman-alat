import api from "@/lib/api"

export const laporanService = {
  getPeminjamanReport: async (startDate?: string, endDate?: string) => {
    const response = await api.get("/laporan/peminjaman/pdf", {
      params: { startDate, endDate },
      responseType: "blob", // untuk download file
    })
    return response.data
  },
}