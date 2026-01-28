"use client"
import { Modal } from "@/components/dashboard/modal"
import { AlertCircle } from "lucide-react"

interface RejectDetailModalProps {
  isOpen: boolean
  onClose: () => void
  keterangan: string
  peminjaman: {
    kode: string
    alat: string
    tanggal: string
  }
}

export function RejectDetailModal({ isOpen, onClose, keterangan, peminjaman }: RejectDetailModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Peminjaman Ditolak"
      size="lg"
    >
      <div className="space-y-5">
        {/* Header Info with Icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Detail Penolakan</p>
            <p className="text-xs text-muted-foreground">Informasi lengkap tentang penolakan peminjaman</p>
          </div>
        </div>

        {/* Peminjaman Info */}
        <div className="rounded-xl bg-muted/50 p-4 space-y-2">
          <div className="flex items-start justify-between text-sm">
            <span className="text-muted-foreground">Kode Peminjaman:</span>
            <span className="font-mono font-semibold text-primary">{peminjaman.kode}</span>
          </div>
          <div className="flex items-start justify-between text-sm">
            <span className="text-muted-foreground">Alat:</span>
            <span className="font-medium text-foreground text-right max-w-[60%]">{peminjaman.alat}</span>
          </div>
          <div className="flex items-start justify-between text-sm">
            <span className="text-muted-foreground">Tanggal Pengajuan:</span>
            <span className="font-medium text-foreground">{peminjaman.tanggal}</span>
          </div>
        </div>

        {/* Keterangan Penolakan */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Alasan Penolakan:
          </label>
          <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {keterangan || "Tidak ada keterangan"}
            </p>
          </div>
        </div>

        {/* Info Helper */}
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              Anda dapat mengajukan peminjaman kembali dengan memperbaiki hal-hal yang disebutkan dalam alasan penolakan di atas.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:opacity-90 hover:shadow-primary/40"
          >
            Mengerti
          </button>
        </div>
      </div>
    </Modal>
  )
}