"use client"
import Link from "next/link"
import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ClipboardList,
  RotateCcw,
  FileText,
  LogOut,
  CheckCircle,
  FileBarChart,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  role: "admin" | "petugas" | "peminjam"
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuthStore()

  const getNavItems = (): NavItem[] => {
    const baseHref = `/dashboard/${role}`

    if (role === "admin") {
      return [
        { label: "Dashboard", href: baseHref, icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Users", href: `${baseHref}/users`, icon: <Users className="h-5 w-5" /> },
        { label: "Alat", href: `${baseHref}/alat`, icon: <Package className="h-5 w-5" /> },
        { label: "Kategori", href: `${baseHref}/kategori`, icon: <FolderTree className="h-5 w-5" /> },
        { label: "Peminjaman", href: `${baseHref}/peminjaman`, icon: <ClipboardList className="h-5 w-5" /> },
        { label: "Pengembalian", href: `${baseHref}/pengembalian`, icon: <RotateCcw className="h-5 w-5" /> },
        { label: "Log Aktivitas", href: `${baseHref}/logs`, icon: <FileText className="h-5 w-5" /> },
      ]
    }

    if (role === "petugas") {
      return [
        { label: "Dashboard", href: baseHref, icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: "Approve Peminjaman", href: `${baseHref}/peminjaman`, icon: <CheckCircle className="h-5 w-5" /> },
        { label: "Monitor Pengembalian", href: `${baseHref}/pengembalian`, icon: <RotateCcw className="h-5 w-5" /> },
        { label: "Cetak Laporan", href: `${baseHref}/laporan`, icon: <FileBarChart className="h-5 w-5" /> },
      ]
    }

    return [
      { label: "Dashboard", href: baseHref, icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: "Daftar Alat", href: `${baseHref}/alat`, icon: <Package className="h-5 w-5" /> },
      { label: "Peminjaman Saya", href: `${baseHref}/peminjaman`, icon: <ClipboardList className="h-5 w-5" /> },
      { label: "Pengembalian", href: `${baseHref}/pengembalian`, icon: <RotateCcw className="h-5 w-5" /> },
    ]
  }

  const navItems = getNavItems()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col glass-strong border-r border-border/30">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/30 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary glow-primary">
          <Image
            src="/LOGO STMJ.png"
            alt="Logo Aplikasi"
            width={32}
            height={32}
          />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground">Peminjaman</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                isActive
                  ? "text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              {/* Active indicator glow background */}
              {isActive && <div className="absolute inset-0 rounded-xl gradient-primary opacity-100 glow-primary" />}

              {/* Active side indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground" />
              )}

              <span className="relative z-10">{item.icon}</span>
              <span className="relative z-10">{item.label}</span>

              {isActive && <ChevronRight className="relative z-10 ml-auto h-4 w-4 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-border/30 p-4">
        <div className="mb-3 rounded-xl glass p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent text-sm font-bold text-primary-foreground">
              {user?.nama_lengkap?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.nama_lengkap}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
            </div>
          </div>
          <span className="mt-3 inline-flex items-center rounded-full gradient-primary px-3 py-1 text-xs font-medium capitalize text-primary-foreground glow-primary">
            {role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-all duration-300 hover:bg-destructive/10 glow-destructive"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
