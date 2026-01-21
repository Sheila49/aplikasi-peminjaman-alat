"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { CheckCircle, XCircle, Printer } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import type { Peminjaman } from "@/lib/types"

export default function PetugasPeminjamanPage() {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await peminjamanService.getAll(page)
      setPeminjamanList(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch (error) {
      toast.error("Gagal memuat data peminjaman")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (id: number) => {
    try {
      await peminjamanService.approve(id)
      toast.success("Peminjaman disetujui")
      fetchData()
    } catch (error) {
      toast.error("Gagal menyetujui peminjaman")
      console.error(error)
    }
  }

  const handleReject = async (id: number) => {
    try {
      await peminjamanService.reject(id)
      toast.success("Peminjaman ditolak")
      fetchData()
    } catch (error) {
      toast.error("Gagal menolak peminjaman")
      console.error(error)
    }
  }

  const generateBuktiPeminjaman = (peminjaman: Peminjaman) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const statusLabels: Record<string, string> = {
      diajukan: "Diajukan",
      disetujui: "Disetujui",
      ditolak: "Ditolak",
      dipinjam: "Dipinjam",
      dikembalikan: "Dikembalikan",
    }

    const formatDate = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    }

    const formatTime = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bukti Peminjaman - ${peminjaman.kode_peminjaman}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px 30px; }
          .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 50px; height: 50px; background: white; border-radius: 50%; padding: 5px; }
          .school-info h1 { font-size: 16px; font-weight: 700; }
          .school-info p { font-size: 9px; opacity: 0.95; margin-top: 2px; }
          .doc-title { text-align: right; }
          .doc-title h2 { font-size: 24px; font-weight: 700; letter-spacing: 1px; }
          .doc-title .subtitle { font-size: 10px; margin-top: 3px; opacity: 0.9; }
          .transaction-code { background: rgba(255,255,255,0.15); padding: 8px 15px; border-radius: 6px; display: inline-block; font-size: 11px; font-weight: 600; }
          
          .info-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 20px 30px; }
          .info-row { display: flex; padding: 5px 0; font-size: 11px; }
          .info-label { width: 180px; color: #64748b; font-weight: 500; }
          .info-value { flex: 1; color: #1e293b; font-weight: 600; }
          
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
          .status-diajukan { background: #fef3c7; color: #92400e; }
          .status-disetujui { background: #dbeafe; color: #1e40af; }
          .status-ditolak { background: #fee2e2; color: #991b1b; }
          .status-dipinjam { background: #d1fae5; color: #065f46; }
          .status-dikembalikan { background: #e5e7eb; color: #1f2937; }
          
          .transaction-table { margin: 20px 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .table-header { background: #f1f5f9; padding: 12px 20px; border-bottom: 2px solid #cbd5e1; }
          .table-header h3 { font-size: 12px; color: #334155; font-weight: 600; }
          .table-row { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .table-row:last-child { border-bottom: none; }
          .row-label { font-size: 11px; color: #64748b; }
          .row-value { font-size: 11px; color: #1e293b; font-weight: 600; }
          .row-main { font-size: 13px; font-weight: 700; color: #1e293b; }
          
          .details-section { margin: 20px 30px; background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px 20px; }
          .details-section h4 { font-size: 11px; color: #854d0e; margin-bottom: 10px; font-weight: 600; }
          .details-section p { font-size: 10px; color: #713f12; line-height: 1.5; }
          
          .footer { margin: 30px 30px 20px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
          .signature-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .signature-box { text-align: center; width: 45%; }
          .signature-box .label { font-size: 10px; color: #64748b; margin-bottom: 50px; }
          .signature-box .name { font-size: 11px; font-weight: 600; color: #1e293b; border-top: 1px solid #cbd5e1; padding-top: 8px; display: inline-block; min-width: 150px; }
          .signature-box .role { font-size: 9px; color: #64748b; margin-top: 3px; }
          
          .footer-note { text-align: center; padding: 15px; background: #f8fafc; border-radius: 6px; }
          .footer-note p { font-size: 9px; color: #64748b; line-height: 1.6; }
          .footer-note .timestamp { font-weight: 600; color: #1e293b; margin-top: 5px; }
          
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none; }
            @page { margin: 1cm; }
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
                <h2>BUKTI PEMINJAMAN</h2>
                <p class="subtitle">Invoice Peminjaman Alat</p>
              </div>
            </div>
            <div class="transaction-code">
              No. Transaksi: ${peminjaman.kode_peminjaman}
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Tanggal Transaksi</div>
              <div class="info-value">${formatDate(peminjaman.tanggal_pengajuan)} ${formatTime(peminjaman.tanggal_pengajuan)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Peminjam</div>
              <div class="info-value">${peminjaman.peminjam?.nama_lengkap || '-'} (${peminjaman.peminjam?.username || '-'})</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kategori</div>
              <div class="info-value">Peminjaman Alat Laboratorium</div>
            </div>
            <div class="info-row">
              <div class="info-label">Status</div>
              <div class="info-value">
                <span class="status-badge status-${peminjaman.status}">
                  ${statusLabels[peminjaman.status] || peminjaman.status}
                </span>
              </div>
            </div>
          </div>

          <div class="transaction-table">
            <div class="table-header">
              <h3>DETAIL TRANSAKSI PEMINJAMAN</h3>
            </div>
            <div class="table-row">
              <span class="row-label">Kode Alat</span>
              <span class="row-value">${peminjaman.alat?.kode_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Nama Alat</span>
              <span class="row-main">${peminjaman.alat?.nama_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Kategori Alat</span>
              <span class="row-value">${peminjaman.alat?.kategori?.nama_kategori || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Pinjam</span>
              <span class="row-main">${peminjaman.jumlah_pinjam} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Tanggal Pinjam</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_pinjam)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Batas Kembali</span>
              <span class="row-value">${formatDate(peminjaman.tanggal_kembali_rencana)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Lokasi Penyimpanan</span>
              <span class="row-value">${peminjaman.alat?.lokasi_penyimpanan || '-'}</span>
            </div>
          </div>

          ${peminjaman.keperluan || peminjaman.catatan ? `
          <div class="details-section">
            ${peminjaman.keperluan ? `
              <h4>📋 Keperluan Peminjaman</h4>
              <p>${peminjaman.keperluan}</p>
            ` : ''}
            ${peminjaman.catatan ? `
              <h4 style="margin-top: 10px;">📝 Catatan</h4>
              <p>${peminjaman.catatan}</p>
            ` : ''}
          </div>
          ` : ''}

          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="label">Peminjam</div>
                <div class="name">${peminjaman.peminjam?.nama_lengkap || '-'}</div>
                <div class="role">${peminjaman.peminjam?.role || 'Siswa/Guru'}</div>
              </div>
              <div class="signature-box">
                <div class="label">Petugas Laboratorium</div>
                <div class="name">${peminjaman.penyetuju?.nama_lengkap || '________________'}</div>
                <div class="role">Kepala Laboratorium</div>
              </div>
            </div>
            
            <div class="footer-note">
              <p><strong>Terima Kasih</strong></p>
              <p>Dokumen ini dicetak secara otomatis dari Sistem Peminjaman Lab SMK Negeri 1 Jenangan</p>
              <p class="timestamp">Dicetak: ${new Date().toLocaleString('id-ID', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</p>
            </div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px;">
            Cetak PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Tutup
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      diajukan: "bg-yellow-500/10 text-yellow-500",
      disetujui: "bg-primary/10 text-primary",
      ditolak: "bg-destructive/10 text-destructive",
      dipinjam: "bg-blue-500/10 text-blue-500",
      dikembalikan: "bg-green-500/10 text-green-500",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || ""}`}
      >
        {status}
      </span>
    )
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "peminjam", label: "Peminjam", render: (p: Peminjaman) => p.peminjam?.nama_lengkap || "-" },
    { key: "alat", label: "Alat", render: (p: Peminjaman) => p.alat?.nama_alat || "-" },
    { key: "jumlah_pinjam", label: "Jumlah", render: (p: Peminjaman) => p.jumlah_pinjam ?? "-" },
    { 
      key: "tanggal_pinjam", 
      label: "Tgl Pinjam", 
      render: (p: Peminjaman) => 
        p.tanggal_pinjam 
          ? new Date(p.tanggal_pinjam).toLocaleDateString("id-ID") 
          : "-" 
    },
    { 
      key: "tanggal_kembali_rencana", 
      label: "Tgl Kembali", 
      render: (p: Peminjaman) => 
        p.tanggal_kembali_rencana 
          ? new Date(p.tanggal_kembali_rencana).toLocaleDateString("id-ID") 
          : "-" 
    },
    { key: "status", label: "Status", render: (p: Peminjaman) => getStatusBadge(p.status) },
    {
      key: "actions",
      label: "Aksi",
      render: (p: Peminjaman) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleApprove(p.id)}
            disabled={p.status !== "diajukan"}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
              p.status === "diajukan"
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Setujui
          </button>
          <button
            onClick={() => handleReject(p.id)}
            disabled={p.status !== "diajukan"}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
              p.status === "diajukan"
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Tolak
          </button>
          <button
            onClick={() => generateBuktiPeminjaman(p)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Header title="Approve Peminjaman" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Daftar Peminjaman</h2>
          <p className="text-sm text-muted-foreground">Setujui atau tolak permintaan peminjaman</p>
        </div>

        <DataTable
          columns={columns}
          data={peminjamanList}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}