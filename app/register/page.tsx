"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Eye, EyeOff, Loader2, Wrench, User, Mail, Lock } from "lucide-react"
import { registerSchema, type RegisterFormData } from "@/lib/validations"
import { authService } from "@/lib/services/auth-service"
import { useAuthStore } from "@/store/auth-store"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      login(response.user, response.token)
      toast.success("Registrasi berhasil!")
      router.push(`/dashboard/${response.user.role}`)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Registrasi gagal. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Animated gradient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-[120px] animate-pulse" />
        <div
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />
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
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent glow-accent">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Buat Akun</h1>
          <p className="mt-2 text-sm text-muted-foreground">Bergabung dengan sistem peminjaman</p>
        </div>

        {/* Glass Card */}
        <div className="rounded-3xl glass-strong p-8 shadow-2xl animate-slide-up">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-card-foreground">Daftar</h2>
            <p className="mt-2 text-sm text-muted-foreground">Isi data berikut untuk membuat akun</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-card-foreground">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  placeholder="John Doe"
                  className={`w-full rounded-2xl border bg-input/30 pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none ${
                    errors.name
                      ? "border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                      : "border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive animate-fade-in">{errors.name.message}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="nama@email.com"
                  className={`w-full rounded-2xl border bg-input/30 pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none ${
                    errors.email
                      ? "border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                      : "border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive animate-fade-in">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-card-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border bg-input/30 pl-11 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none ${
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive animate-fade-in">{errors.password.message}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-card-foreground">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border bg-input/30 pl-11 pr-12 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none ${
                    errors.confirmPassword
                      ? "border-destructive/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                      : "border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 hover:border-border"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive animate-fade-in">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-2xl gradient-accent py-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:shadow-accent/25 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50 glow-accent"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Aplikasi Peminjaman Alat. All rights reserved.
        </p>
      </div>
    </div>
  )
}
