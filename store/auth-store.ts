import { create } from "zustand"
import Cookies from "js-cookie"
import type { User } from "@/lib/types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token?: string) => void
  logout: () => void
  updateUser: (user: User) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user: User, token?: string) => {
    const authToken = token || Cookies.get("auth_token") || ""
    if (token) {
      Cookies.set("auth_token", token, {
        expires: 7, // 7 days
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      })
    }
    set({
      user,
      token: authToken,
      isAuthenticated: true,
    })
  },
  logout: () => {
    Cookies.remove("auth_token", { path: "/" })
    Cookies.remove("user_role", { path: "/" })
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },
  updateUser: (user: User) =>
    set({
      user,
    }),
  initialize: () => {
    const token = Cookies.get("auth_token")
    if (token) {
      // Assuming we can get user from token or API, but for now, set token
      set({
        token,
        isAuthenticated: true,
      })
      // TODO: Fetch user data if needed
    }
  },
}))
