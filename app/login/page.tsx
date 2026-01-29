"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { authService } from "@/lib/services/auth-service"
import { useAuthStore } from "@/store/auth-store"
import Image from "next/image"

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

      Cookies.set("auth_token", token, { path: "/" })
      Cookies.set("role", user.role || "admin", { path: "/" })

      login(user, token)

      toast.success("Login berhasil")

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden p-4 sm:p-6 md:p-8">
      {/* Animated background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-blue-600 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-600 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Login Card Container */}
      <div className="w-full max-w-[340px] sm:max-w-md mx-4 sm:mx-auto relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 animate-fade-in">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 ring-4 ring-blue-500/20">
            <Image
              src="/LOGO STMJ.png"
              alt="Logo"
              width={56}
              height={56}
              className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
            />
          </div>
        </div>

        {/* Card */}
        <div className="relative rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-2xl p-5 sm:p-6 md:p-8 shadow-2xl border border-gray-700/50 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl sm:rounded-2xl md:rounded-3xl blur-2xl opacity-40" />
          
          {/* Content */}
          <div className="relative">
            {/* Header */}
            <div className="mb-3 sm:mb-4 md:mb-6 text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Peminjaman Alat
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
                Sistem Manajemen Peminjaman Modern
              </p>
            </div>

            {/* Title */}
            <div className="mb-3 sm:mb-4 md:mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Selamat Datang</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Masukkan kredensial untuk melanjutkan</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              {/* Email */}
              <div className="animate-slide-right" style={{ animationDelay: '0.5s' }}>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2">
                  Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="nama@email.com"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl bg-gray-900/60 border text-sm sm:text-base text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : "border-gray-700 focus:border-blue-500 focus:ring-blue-500/50"
                  }`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1.5 sm:mt-2 text-xs text-red-400 animate-fade-in">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="animate-slide-right" style={{ animationDelay: '0.6s' }}>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-10 sm:pr-12 rounded-lg sm:rounded-xl bg-gray-900/60 border text-sm sm:text-base text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                        : "border-gray-700 focus:border-blue-500 focus:ring-blue-500/50"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 sm:mt-2 text-xs text-red-400 animate-fade-in">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 md:py-3.5 mt-3 sm:mt-4 md:mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 animate-fade-in"
                style={{ animationDelay: '0.7s' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="text-sm sm:text-base">Memproses...</span>
                  </>
                ) : (
                  <span className="text-sm sm:text-base">Masuk</span>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-3 sm:mt-4 md:mt-6 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <p className="text-xs sm:text-sm text-gray-400">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-3 sm:mt-4 md:mt-6 text-center text-xs text-gray-500 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          © 2026 Aplikasi Peminjaman Alat. All rights reserved.
        </p>
      </div>
    </div>
  )
}