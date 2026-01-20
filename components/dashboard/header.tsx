"use client"
import { Bell, Menu, Search } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/30 glass px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-xl border border-border/50 bg-input/30 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Notification */}
        <button className="relative rounded-xl p-2.5 text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full gradient-accent animate-pulse" />
        </button>

        {/* User Avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground glow-primary">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
