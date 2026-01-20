import api from "@/lib/api"

export const reportService = {
  getPeminjamanReport: async (startDate?: string, endDate?: string) => {
    const response = await api.get("/reports", {
      params: { startDate, endDate },
      responseType: "blob",
    })
    return response.data
  },
}
