import api from "@/lib/api"
import type { LogAktivitas, PaginatedResponse, User, ApiResponse } from "@/lib/types"

export const logService = {
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<LogAktivitas>> => {
    try {
      console.log("🔍 === FETCHING LOGS ===")
      console.log("📄 Page:", page, "Limit:", limit)
      
      // ✅ Try different populate patterns that backends commonly use
      const response = await api.get<PaginatedResponse<LogAktivitas>>("/log", {
        params: { 
          page, 
          limit,
          // Try multiple patterns
          populate: 'user',
          include: 'user',
          with: 'user',
        },
      })

      console.log("📦 === RAW RESPONSE ===")
      console.log("Full response:", response.data)
      console.log("Data count:", response.data.data.length)
      
      // Log first 3 items
      response.data.data.slice(0, 3).forEach((log, idx) => {
        console.log(`📋 Log ${idx + 1}:`, {
          id: log.id,
          user_id: log.user_id,
          user: log.user,
          aksi: log.aksi,
          tabel: log.tabel,
        })
      })

      // ✅ Check if user data is populated
      const hasUserData = response.data.data.some(log => log.user && typeof log.user === 'object')
      
      console.log("🔍 Has user data populated:", hasUserData)
      
      if (!hasUserData && response.data.data.length > 0) {
        console.log("⚠️ USER DATA NOT POPULATED - Fetching manually...")
        
        // Get unique user IDs (exclude null/undefined)
        const userIds = [...new Set(
          response.data.data
            .map(log => log.user_id)
            .filter((id): id is number => id !== null && id !== undefined)
        )]
        
        console.log("👥 Unique user IDs to fetch:", userIds)
        
        if (userIds.length > 0) {
          console.log("🚀 Starting to fetch users...")
          
          // Fetch all users
          const usersPromises = userIds.map(async (id) => {
            try {
              console.log(`📡 Fetching user ${id}...`)
              const userResponse = await api.get<ApiResponse<User>>(`/users/${id}`)
              console.log(`✅ Fetched user ${id}:`, userResponse.data.data)
              return { id, user: userResponse.data.data }
            } catch (error: any) {
              console.error(`❌ Failed to fetch user ${id}:`, error)
              console.error(`Error details:`, {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
              })
              
              // Try alternative endpoint
              try {
                console.log(`🔄 Trying alternative endpoint /user/${id}...`)
                const altResponse = await api.get<ApiResponse<User>>(`/user/${id}`)
                console.log(`✅ Success with /user/${id}:`, altResponse.data.data)
                return { id, user: altResponse.data.data }
              } catch (altError) {
                console.error(`❌ Alternative endpoint also failed for user ${id}`)
                return { id, user: null }
              }
            }
          })
          
          const usersResults = await Promise.all(usersPromises)
          
          // Create user map
          const usersMap = new Map<number, User>()
          usersResults.forEach(result => {
            if (result.user) {
              usersMap.set(result.id, result.user)
              console.log(`✅ Added user ${result.id} to map:`, result.user.nama_lengkap)
            }
          })
          
          console.log("📊 Users map created:", usersMap.size, "users")
          console.log("Users map contents:", Array.from(usersMap.entries()))
          
          // Inject user data into logs
          response.data.data = response.data.data.map(log => {
            const user = log.user_id ? usersMap.get(log.user_id) : undefined
            console.log(`🔗 Log ${log.id}: user_id=${log.user_id}, user=${user?.nama_lengkap || 'null'}`)
            return {
              ...log,
              user: user
            }
          })
          
          console.log("✅ USER DATA MANUALLY POPULATED")
          console.log("Sample after populate:", response.data.data[0])
        } else {
          console.log("⚠️ No valid user IDs found in logs (all null)")
        }
      } else {
        console.log("✅ User data already populated by backend")
      }

      // Final check
      const logsWithUsers = response.data.data.filter(log => log.user).length
      console.log(`📊 Final stats: ${logsWithUsers} logs with user data out of ${response.data.data.length} total`)

      return response.data
    } catch (error: any) {
      console.error("💥 === LOG SERVICE ERROR ===")
      console.error("Error:", error)
      console.error("Error response:", error.response?.data)
      console.error("Error status:", error.response?.status)
      throw error
    }
  },

  getById: async (id: number): Promise<LogAktivitas> => {
    try {
      const response = await api.get(`/log/${id}`, {
        params: {
          populate: 'user',
          include: 'user',
          with: 'user',
        }
      })
      
      let log = response.data.data
      
      // Manually fetch user if not populated
      if (log.user_id && !log.user) {
        try {
          const userResponse = await api.get<ApiResponse<User>>(`/users/${log.user_id}`)
          log.user = userResponse.data.data
        } catch (error) {
          console.error("Failed to fetch user for log:", error)
          try {
            const altResponse = await api.get<ApiResponse<User>>(`/user/${log.user_id}`)
            log.user = altResponse.data.data
          } catch (altError) {
            console.error("Alternative endpoint also failed")
          }
        }
      }
      
      return log
    } catch (error) {
      console.error("Error fetching log by id:", error)
      throw error
    }
  },
}