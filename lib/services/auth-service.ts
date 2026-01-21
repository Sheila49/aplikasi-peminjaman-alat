import type { AuthResponse, LoginCredentials, RegisterData } from "@/lib/types"

export const authService = {
  login: async (
    credentials: LoginCredentials
  ): Promise<{ user: any; token: string }> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(credentials),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.message || "Login gagal")
    }

    const data = await res.json()

    // ✅ ambil dari data.data sesuai backend
    const user = data.data.user
    const token = data.data.token

    console.log("Token:", token)

    // ✅ simpan token agar bisa dipakai di request berikutnya
    localStorage.setItem("token", token)
    // kalau mau session-only:
    // sessionStorage.setItem("token", token)

    return { user, token }
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      throw new Error(err?.message || "Register gagal")
    }

    const result = await response.json()
    return result
  },
}