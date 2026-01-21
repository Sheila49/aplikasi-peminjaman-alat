"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { RotateCcw, Loader2, Calendar, Package, Printer, AlertTriangle } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Modal } from "@/components/dashboard/modal"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { pengembalianSchema, type PengembalianFormData } from "@/lib/validations"
import { useAuthStore } from "@/store/auth-store"
import type { Peminjaman } from "@/lib/types"
import axios from "axios"

export default function PeminjamPengembalianPage() {
  const { user } = useAuthStore()
  const [approvedPeminjaman, setApprovedPeminjaman] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedDenda, setEstimatedDenda] = useState(0)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PengembalianFormData>({
    resolver: zodResolver(pengembalianSchema),
  })

  const kondisiAlat = watch("kondisi_alat")

  useEffect(() => {
    if (selectedPeminjaman) {
      calculateDenda()
    }
  }, [kondisiAlat, selectedPeminjaman])

  const calculateDenda = () => {
    if (!selectedPeminjaman?.tanggal_kembali_rencana) return

    const today = new Date()
    const dueDate = new Date(selectedPeminjaman.tanggal_kembali_rencana)
    const diffTime = today.getTime() - dueDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const keterlambatan = diffDays > 0 ? diffDays : 0
    const dendaKeterlambatan = keterlambatan * 10000
    
    setEstimatedDenda(dendaKeterlambatan)
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await peminjamanService.getByUser(1, 100)
      const filtered = res.data.filter((p) => p.status === "disetujui" || p.status === "dipinjam")
      setApprovedPeminjaman(filtered)
    } catch (error) {
      toast.error("Gagal memuat data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openReturnModal = (peminjaman: Peminjaman) => {
    setSelectedPeminjaman(peminjaman)
    reset({
      peminjaman_id: peminjaman.id,
      kondisi_alat: "",
      jumlah_dikembalikan: 1,
      catatan: "",
    })
    setIsModalOpen(true)
  }

  const generateBuktiPengembalian = (peminjaman: Peminjaman, pengembalianData: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const formatDate = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount)
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Pengembalian - ${peminjaman.kode_peminjaman}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px 30px; }
          .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 50px; height: 50px; background: white; border-radius: 50%; padding: 5px; }
          .school-info h1 { font-size: 16px; font-weight: 700; }
          .school-info p { font-size: 9px; opacity: 0.95; margin-top: 2px; }
          .doc-title { text-align: right; }
          .doc-title h2 { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
          .doc-title .subtitle { font-size: 10px; margin-top: 3px; opacity: 0.9; }
          .transaction-code { background: rgba(255,255,255,0.15); padding: 8px 15px; border-radius: 6px; display: inline-block; font-size: 11px; font-weight: 600; }
          .info-card { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 30px; }
          .info-row { display: flex; padding: 5px 0; font-size: 11px; }
          .info-label { width: 180px; color: #64748b; font-weight: 500; }
          .info-value { flex: 1; color: #1e293b; font-weight: 600; }
          .transaction-table { margin: 20px 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .table-header { background: #f1f5f9; padding: 12px 20px; border-bottom: 2px solid #cbd5e1; }
          .table-header h3 { font-size: 12px; color: #334155; font-weight: 600; }
          .table-row { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
          .row-label { font-size: 11px; color: #64748b; }
          .row-value { font-size: 11px; color: #1e293b; font-weight: 600; }
          .denda-section { margin: 20px 30px; background: ${estimatedDenda > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${estimatedDenda > 0 ? '#fca5a5' : '#86efac'}; border-radius: 8px; padding: 15px 20px; }
          .denda-section h4 { font-size: 11px; color: ${estimatedDenda > 0 ? '#991b1b' : '#065f46'}; margin-bottom: 10px; font-weight: 600; }
          .denda-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 11px; }
          .denda-total { font-size: 14px; font-weight: 700; color: ${estimatedDenda > 0 ? '#dc2626' : '#059669'}; }
          .footer { margin: 30px 30px 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
          .signature-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .signature-box { text-align: center; width: 45%; }
          .signature-box .label { font-size: 10px; color: #64748b; margin-bottom: 50px; }
          .signature-box .name { font-size: 11px; font-weight: 600; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 8px; display: inline-block; min-width: 150px; }
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-top">
              <div class="logo-section">
                <div class="logo">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6kzLcr50r0Qn2c5fd-EGmuyRXAikP9Q5mGg&s" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="school-info">
                  <h1>SMK NEGERI 1 JENANGAN</h1>
                  <p>Laboratorium Alat & Bahan</p>
                  <p>Jl. Niken Gandini No.98, Ponorogo 63492 | (0352) 481236</p>
                </div>
              </div>
              <div class="doc-title">
                <h2>BUKTI PENGEMBALIAN</h2>
                <p class="subtitle">Invoice Pengembalian Alat</p>
              </div>
            </div>
            <div class="transaction-code">
              Ref. Peminjaman: ${peminjaman.kode_peminjaman}
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Tanggal Pengembalian</div>
              <div class="info-value">${formatDate(new Date().toISOString())}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Peminjam</div>
              <div class="info-value">${user?.nama_lengkap || '-'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kondisi Alat</div>
              <div class="info-value">${pengembalianData.kondisi_alat}</div>
            </div>
          </div>

          <div class="transaction-table">
            <div class="table-header">
              <h3>DETAIL PENGEMBALIAN</h3>
            </div>
            <div class="table-row">
              <span class="row-label">Nama Alat</span>
              <span class="row-value">${peminjaman.alat?.nama_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Dikembalikan</span>
              <span class="row-value">${pengembalianData.jumlah_dikembalikan} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Tanggal Pinjam</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_pinjam)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Batas Kembali</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_kembali_rencana)}</span>
            </div>
          </div>

          <div class="denda-section">
            <h4>💰 ESTIMASI DENDA</h4>
            <div class="denda-row">
              <span>Denda Keterlambatan</span>
              <span>${formatCurrency(estimatedDenda)}</span>
            </div>
            ${pengembalianData.kondisi_alat.toLowerCase() !== 'baik' ? `
              <div class="denda-row">
                <span>Denda Kerusakan</span>
                <span>Ditentukan Petugas</span>
              </div>
            ` : ''}
            <div class="denda-row" style="border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 10px;">
              <span style="font-weight: 700;">TOTAL ESTIMASI</span>
              <span class="denda-total">${formatCurrency(estimatedDenda)}</span>
            </div>
          </div>

          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="label">Peminjam</div>
                <div class="name">${user?.nama_lengkap || '-'}</div>
              </div>
              <div class="signature-box">
                <div class="label">Petugas</div>
                <div class="name">________________</div>
              </div>
            </div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Cetak PDF
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const onSubmit = async (data: PengembalianFormData) => {
    if (!user?.id || !selectedPeminjaman) {
      toast.error("Data tidak valid")
      return
    }

    const jumlahDikembalikan = Number(data.jumlah_dikembalikan)
    const jumlahPinjam = Number(selectedPeminjaman.jumlah_pinjam)

    if (!data.kondisi_alat?.trim()) {
      toast.error("Kondisi alat harus dipilih")
      return
    }

    if (isNaN(jumlahDikembalikan) || jumlahDikembalikan <= 0) {
      toast.error("Jumlah dikembalikan harus lebih dari 0")
      return
    }

    if (jumlahDikembalikan > jumlahPinjam) {
      toast.error(`Jumlah dikembalikan tidak boleh melebihi ${jumlahPinjam}`)
      return
    }

    setIsSubmitting(true)

    try {
      const payload: any = {
        peminjaman_id: Number(selectedPeminjaman.id),
        kondisi_alat: data.kondisi_alat.trim().toLowerCase(),
        jumlah_dikembalikan: jumlahDikembalikan,
      }

      if (data.catatan && data.catatan.trim() !== "") {
        payload.catatan = data.catatan.trim()
      }

      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api"

      const response = await axios.post(`${baseURL}/pengembalian`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      toast.success("Pengembalian berhasil dicatat!")
      
      // Generate bukti pengembalian
      generateBuktiPengembalian(selectedPeminjaman, data)
      
      setIsModalOpen(false)
      reset()
      setSelectedPeminjaman(null)
      
      setTimeout(() => {
        fetchData()
      }, 500)
      
    } catch (error: any) {
      console.error("❌ Error:", error)
      
      if (error?.response?.status === 401) {
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.")
      } else if (error?.response?.status === 400) {
        const errorData = error.response.data
        let errorMsg = "Validasi gagal"
        
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = errorData.errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(", ")
          errorMsg = fieldErrors || errorData.message || errorMsg
        } else if (errorData?.message) {
          errorMsg = errorData.message
        }
        
        toast.error(errorMsg)
      } else {
        const errorMsg = error?.response?.data?.message || error?.message || "Gagal melakukan pengembalian"
        toast.error(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <>
      <Header title="Pengembalian Alat" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Alat yang Sedang Dipinjam</h2>
          <p className="mt-1 text-muted-foreground">Kembalikan alat yang sudah selesai digunakan</p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl glass">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          </div>
        ) : approvedPeminjaman.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl glass">
            <RotateCcw className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Tidak ada alat yang perlu dikembalikan</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {approvedPeminjaman.map((peminjaman, index) => {
              const today = new Date()
              const dueDate = new Date(peminjaman.tanggal_kembali_rencana)
              const isOverdue = today > dueDate
              const daysLate = isOverdue ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

              return (
                <div
                  key={peminjaman.id}
                  className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {isOverdue && (
                    <div className="absolute top-3 right-3 bg-red-500/90 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Terlambat {daysLate} hari
                    </div>
                  )}

                  <div className="relative">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-accent glow-accent">
                      <Package className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-card-foreground">{peminjaman.alat?.nama_alat}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">Jumlah: {peminjaman.jumlah_pinjam}</p>
                    <div className="mb-5 space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Tgl Pinjam:{" "}
                        <span className="text-card-foreground">
                          {peminjaman.tanggal_pinjam
                            ? new Date(peminjaman.tanggal_pinjam).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Batas Kembali:{" "}
                        <span className={isOverdue ? "text-red-600 font-semibold" : "text-card-foreground"}>
                          {peminjaman.tanggal_kembali_rencana
                            ? new Date(peminjaman.tanggal_kembali_rencana).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </p>
                      {isOverdue && (
                        <p className="flex items-center gap-2 text-red-600 font-semibold text-xs">
                          💸 Estimasi Denda: {formatCurrency(daysLate * 10000)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openReturnModal(peminjaman)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-accent py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-accent/25 glow-accent"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Kembalikan
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pengembalian Alat">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent">
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedPeminjaman?.alat?.nama_alat}</p>
                  <p className="text-xs text-muted-foreground">Jumlah Dipinjam: {selectedPeminjaman?.jumlah_pinjam}</p>
                </div>
              </div>
            </div>

            {estimatedDenda > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Peringatan Denda</p>
                    <p className="text-xs text-red-700 mt-1">
                      Estimasi denda keterlambatan: <strong>{formatCurrency(estimatedDenda)}</strong>
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Rp 10.000 per hari keterlambatan
                    </p>
                  </div>
                </div>
              </div>
            )}

            <input type="hidden" {...register("peminjaman_id", { valueAsNumber: true })} />

            <div>
              <label className="text-sm font-medium text-card-foreground">
                Kondisi Alat <span className="text-destructive">*</span>
              </label>
              <select
                {...register("kondisi_alat", { required: "Kondisi alat harus dipilih" })}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              >
                <option value="">Pilih Kondisi</option>
                <option value="baik">Baik</option>
                <option value="rusak ringan">Rusak Ringan</option>
                <option value="rusak berat">Rusak Berat</option>
              </select>
              {errors.kondisi_alat && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.kondisi_alat.message}</p>
              )}
              {kondisiAlat && kondisiAlat !== 'baik' && (
                <p className="mt-2 text-xs text-orange-600">
                  ⚠️ Denda kerusakan akan ditentukan oleh petugas
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">
                Jumlah Dikembalikan <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={selectedPeminjaman?.jumlah_pinjam ?? 1}
                {...register("jumlah_dikembalikan", { 
                  valueAsNumber: true,
                  required: "Jumlah dikembalikan harus diisi",
                })}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground">Catatan (opsional)</label>
              <textarea
                {...register("catatan")}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setSelectedPeminjaman(null)
                  reset()
                }}
                disabled={isSubmitting}
                className="rounded-2xl border border-border/50 px-5 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl gradient-accent px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-50 glow-accent"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Memproses..." : "Kembalikan"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}