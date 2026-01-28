"use client"
import { useState, useEffect } from "react"
import { Bell, Menu, Search, X } from "lucide-react"
import { useAuthStore } from "@/store/auth-store"

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  onSearch?: (query: string) => void
  searchValue?: string
  placeholder?: string
}

export function Header({ 
  title, 
  onMenuClick, 
  onSearch, 
  searchValue = "",
  placeholder = "Search..." 
}: HeaderProps) {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState(searchValue)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Sync dengan parent component
  useEffect(() => {
    setSearchQuery(searchValue)
  }, [searchValue])

  // Debounce search untuk performa lebih baik
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchQuery)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery, onSearch])

  const handleClearSearch = () => {
    setSearchQuery("")
    if (onSearch) {
      onSearch("")
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

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
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${
            isSearchFocused ? "text-primary" : "text-muted-foreground/60"
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={placeholder}
            className={`w-64 rounded-xl border bg-input/30 py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:outline-none ${
              isSearchFocused
                ? "border-primary/50 ring-2 ring-primary/20 w-72"
                : "border-border/50 hover:border-border"
            }`}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-0.5 text-muted-foreground/60 transition-all duration-300 hover:bg-secondary hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Notification */}
        <button className="relative rounded-xl p-2.5 text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full gradient-accent animate-pulse" />
        </button>

        {/* User Avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground glow-primary">
          {user?.nama_lengkap?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </header>
  )
}