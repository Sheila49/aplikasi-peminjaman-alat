"use client"
import { useEffect, useRef } from "react"
import { Modal } from "@/components/dashboard/modal"
import { AlertCircle } from "lucide-react"

interface RejectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (keterangan: string) => void
  peminjam: string
  alat: string
  isLoading?: boolean
}

export function RejectModal({ isOpen, onClose, onConfirm, peminjam, alat, isLoading = false }: RejectModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const keterangan = formData.get("keterangan") as string
    
    if (!keterangan.trim()) {
      textareaRef.current?.focus()
      return
    }
    
    onConfirm(keterangan.trim())
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Tolak Peminjaman"
      preventClose={isLoading}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Warning Info */}
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 text-destructive flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Peminjaman akan ditolak</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{peminjam}</span> tidak akan bisa meminjam{" "}
                <span className="font-medium text-foreground">{alat}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Keterangan Input */}
        <div>
          <label htmlFor="keterangan" className="block text-sm font-semibold text-foreground mb-2">
            Keterangan Penolakan <span className="text-destructive">*</span>
          </label>
          <textarea
            ref={textareaRef}
            id="keterangan"
            name="keterangan"
            rows={4}
            required
            disabled={isLoading}
            placeholder="Contoh: Alat sedang dalam perbaikan, Stok tidak mencukupi, dll..."
            className="w-full rounded-xl border border-border bg-input/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Keterangan ini akan dilihat oleh peminjam
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-lg shadow-destructive/30 transition-all duration-300 hover:opacity-90 hover:shadow-destructive/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </>
            ) : (
              "Tolak Peminjaman"
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}