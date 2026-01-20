"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import { Eye, EyeOff, Loader2, Wrench } from "lucide-react"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { authService } from "@/lib/services/auth-service"
import { useAuthStore } from "@/store/auth-store"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const response = await authService.login(data)

      const token = response.token
      const user = response.user

      if (!token || !user) {
        throw new Error("Token atau user tidak valid")
      }

      // Simpan ke cookie
      Cookies.set("auth_token", token, { path: "/" })
      Cookies.set("role", user.role || "admin", { path: "/" })

      // Simpan ke store
      login(user, token)

      toast.success("Login berhasil")

      // Redirect sesuai role
      if (user.role === "admin") {
        router.replace("/dashboard/admin")
      } else if (user.role === "petugas") {
        router.replace("/dashboard/petugas")
      } else if (user.role === "peminjam") {
        router.replace("/dashboard/peminjam")
      } else {
        router.replace("/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      toast.error("Login gagal. Email atau password salah.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Animated gradient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary glow-primary">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Peminjaman Alat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistem Manajemen Peminjaman
          </p>
        </div>

        {/* Glass Card */}
        <div className="rounded-3xl glass-strong p-8 shadow-2xl animate-slide-up">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-card-foreground">
              Selamat Datang
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Masukkan kredensial untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-card-foreground"
              >
                Email
              </label>
              <div className="relative group">
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="nama@email.com"
                  className={`w-full rounded-2xl border bg-input/30 px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none ${
                    errors.email
                      ? "border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                      : "border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive animate-fade-in">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-card-foreground"
              >
                Password
              </label>
              <div className="relative group">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border bg-input/30 px-4 py-3.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none ${
                    errors.password
                      ? "border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                      : "border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive animate-fade-in">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-2xl gradient-primary py-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 glow-primary"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Aplikasi Peminjaman Alat. All rights
          reserved.
        </p>
      </div>
    </div>
  )
}