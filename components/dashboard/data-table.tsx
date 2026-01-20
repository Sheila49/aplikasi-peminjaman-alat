"use client"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type React from "react"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  isLoading,
  page = 1,
  totalPages = 1,
  onPageChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl glass">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl glass">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/30 bg-muted/20">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-muted/50 p-3">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Tidak ada data</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id}
                  className="group transition-all duration-300 hover:bg-primary/5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4 text-sm text-card-foreground">
                      {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key]?.toString()}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/30 px-5 py-4">
          <span className="text-sm text-muted-foreground">
            Halaman <span className="font-medium text-foreground">{page}</span> dari{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="rounded-xl border border-border/50 p-2.5 text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="rounded-xl border border-border/50 p-2.5 text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Need to import Package for empty state
import { Package } from "lucide-react"
