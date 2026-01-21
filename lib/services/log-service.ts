import api from "@/lib/api"
import type { LogAktivitas, PaginatedResponse } from "@/lib/types"

export const logService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<LogAktivitas>> => {
    const response = await api.get<PaginatedResponse<LogAktivitas>>("/log", {
      params: { page, limit },
    })
    return response.data
  },

  getById: async (id: number): Promise<LogAktivitas> => {
    const response = await api.get(`/log/${id}`)
    return response.data.data
  },
}