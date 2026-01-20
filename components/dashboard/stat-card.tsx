import type React from "react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}

export function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-transparent" />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${trendUp ? "text-primary" : "text-destructive"}`}>
              {trendUp ? "+" : ""}
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground glow-primary transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  )
}
