"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { peminjamanService } from "@/lib/services/peminjaman-service"
import { useAuthStore } from "@/store/auth-store"
import type { Peminjaman } from "@/lib/types"

export default function PeminjamPeminjamanPage() {
  const { user } = useAuthStore()
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const res = await peminjamanService.getByUser(user.id, page)
      setPeminjamanList(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch (error) {
      toast.error("Gagal memuat data peminjaman")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page, user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      diajukan: "bg-yellow-500/10 text-yellow-500",
      disetujui: "bg-blue-500/10 text-blue-500",
      ditolak: "bg-red-500/10 text-red-500",
      dipinjam: "bg-green-500/10 text-green-500",
      dikembalikan: "bg-gray-500/10 text-gray-500",
    }
    const labels: Record<string, string> = {
      diajukan: "Diajukan",
      disetujui: "Disetujui",
      ditolak: "Ditolak",
      dipinjam: "Dipinjam",
      dikembalikan: "Dikembalikan",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ""}`}
      >
        {labels[status] || status}
      </span>
    )
  }

  const generatePDF = (peminjaman: Peminjaman) => {
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
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
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
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; margin-bottom: 15px; border-radius: 6px; }
          .header-content { display: flex; justify-content: space-between; align-items: center; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 60px; height: 60px; background: white; border-radius: 50%; padding: 6px; }
          .school-info h1 { font-size: 18px; margin-bottom: 3px; }
          .school-info p { font-size: 10px; opacity: 0.9; line-height: 1.3; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { font-size: 28px; font-weight: 700; }
          .invoice-title p { font-size: 11px; margin-top: 3px; }
          .info-section { margin: 15px 0; display: flex; justify-content: space-between; }
          .info-box h3 { font-size: 12px; color: #1e3a8a; margin-bottom: 6px; font-weight: 600; }
          .info-box p { font-size: 11px; margin: 3px 0; color: #333; line-height: 1.4; }
          .info-box strong { display: inline-block; width: 110px; }
          .status-box { text-align: right; }
          .status-box .label { font-size: 10px; color: #666; margin-bottom: 5px; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 600; }
          .status-diajukan { background: #fef3c7; color: #92400e; }
          .status-disetujui { background: #dbeafe; color: #1e40af; }
          .status-ditolak { background: #fee2e2; color: #991b1b; }
          .status-dipinjam { background: #d1fae5; color: #065f46; }
          .status-dikembalikan { background: #e5e7eb; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          thead { background: #1e3a8a; color: white; }
          th { padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 600; }
          td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tbody tr:hover { background: #f9fafb; }
          .detail-section { margin: 12px 0; padding: 12px; background: #f9fafb; border-radius: 4px; }
          .detail-row { display: flex; margin: 5px 0; }
          .detail-label { width: 160px; font-weight: 600; color: #1e3a8a; font-size: 11px; }
          .detail-value { flex: 1; color: #333; font-size: 11px; }
          .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 220px; }
          .signature-box p { font-size: 11px; margin-bottom: 50px; color: #666; }
          .signature-box .name { font-weight: 600; border-top: 1px solid #333; padding-top: 8px; display: inline-block; min-width: 180px; font-size: 11px; }
          .signature-box .title { font-size: 10px; color: #666; margin-top: 3px; }
          .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #666; line-height: 1.4; }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
            @page { margin: 0.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            <div class="logo-section">
              <div class="logo">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6kzLcr50r0Qn2c5fd-EGmuyRXAikP9Q5mGg&s" alt="Logo SMK Negeri 1 Jenangan" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
              <div class="school-info">
                <h1>SMK NEGERI 1 JENANGAN</h1>
                <p>Jl. Niken Gandini No.98, Plampitan, Setono</p>
                <p>Kec. Jenangan, Kab. Ponorogo, Jawa Timur 63492</p>
                <p>Telp: (0352) 481236</p>
              </div>
            </div>
            <div class="invoice-title">
              <h2>BUKTI PEMINJAMAN</h2>
              <p>NO: ${peminjaman.kode_peminjaman}</p>
              <p style="margin-top: 15px;">Tanggal Pengajuan</p>
              <p style="font-weight: 600;">${formatDate(peminjaman.tanggal_pengajuan)}</p>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>PEMINJAM:</h3>
            <p><strong>Nama:</strong> ${peminjaman.peminjam?.nama_lengkap || user?.nama_lengkap || '-'}</p>
            <p><strong>Username:</strong> ${peminjaman.peminjam?.username || user?.username || '-'}</p>
            <p><strong>Email:</strong> ${peminjaman.peminjam?.email || user?.email || '-'}</p>
            <p><strong>No. Telepon:</strong> ${peminjaman.peminjam?.no_telepon || user?.no_telepon || '-'}</p>
          </div>
          <div class="status-box">
            <div class="label">Status Peminjaman</div>
            <span class="status-badge status-${peminjaman.status}">
              ${statusLabels[peminjaman.status] || peminjaman.status}
            </span>
          </div>
        </div>

        <div class="detail-section">
          <h3 style="color: #1e3a8a; margin-bottom: 15px;">Detail Peminjaman</h3>
          <div class="detail-row">
            <div class="detail-label">Keperluan:</div>
            <div class="detail-value">${peminjaman.keperluan || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Pinjam:</div>
            <div class="detail-value">${formatDate(peminjaman.tanggal_pinjam)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Kembali (Rencana):</div>
            <div class="detail-value">${formatDate(peminjaman.tanggal_kembali_rencana)}</div>
          </div>
          ${peminjaman.penyetuju ? `
          <div class="detail-row">
            <div class="detail-label">Disetujui Oleh:</div>
            <div class="detail-value">${peminjaman.penyetuju.nama_lengkap}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal Persetujuan:</div>
            <div class="detail-value">${formatDate(peminjaman.tanggal_persetujuan)}</div>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Kode Alat</th>
              <th>Nama Alat</th>
              <th>Kategori</th>
              <th style="text-align: center;">Jumlah Pinjam</th>
              <th>Kondisi</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${peminjaman.alat?.kode_alat || '-'}</strong></td>
              <td>${peminjaman.alat?.nama_alat || '-'}</td>
              <td>${peminjaman.alat?.kategori?.nama_kategori || '-'}</td>
              <td style="text-align: center; font-weight: 600; font-size: 16px;">${peminjaman.jumlah_pinjam}</td>
              <td>${peminjaman.alat?.kondisi || '-'}</td>
              <td>${peminjaman.alat?.lokasi_penyimpanan || '-'}</td>
            </tr>
          </tbody>
        </table>

        ${peminjaman.catatan || peminjaman.catatan_persetujuan ? `
        <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
          ${peminjaman.catatan ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #1e3a8a;">Catatan Peminjam:</strong>
              <p style="margin-top: 5px; font-size: 13px; color: #333;">${peminjaman.catatan}</p>
            </div>
          ` : ''}
          ${peminjaman.catatan_persetujuan ? `
            <div>
              <strong style="color: #1e3a8a;">Catatan Persetujuan:</strong>
              <p style="margin-top: 5px; font-size: 13px; color: #333;">${peminjaman.catatan_persetujuan}</p>
            </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <p>Peminjam</p>
            <div class="name">${peminjaman.peminjam?.nama_lengkap || user?.nama_lengkap || '-'}</div>
            <div class="title">${peminjaman.peminjam?.role === 'peminjam' ? 'Siswa/Guru' : peminjaman.peminjam?.role || ''}</div>
          </div>
          <div class="signature-box">
            <p>Petugas Laboratorium</p>
            <div class="name">${peminjaman.penyetuju?.nama_lengkap || '_________________'}</div>
            <div class="title">${peminjaman.penyetuju ? 'Kepala Laboratorium' : ''}</div>
          </div>
        </div>

        <div class="footer">
          <p><strong>TERIMA KASIH</strong></p>
          <p style="margin-top: 5px;">Dokumen ini dicetak secara otomatis dari Sistem Peminjaman Alat Lab SMK Negeri 1 Jenangan</p>
          <p style="margin-top: 5px;">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 12px 24px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
            Cetak PDF
          </button>
          <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
            Tutup
          </button>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const columns = [
    { 
      key: "kode_peminjaman", 
      label: "Kode",
      render: (p: Peminjaman) => (
        <span className="font-mono text-xs">{p.kode_peminjaman}</span>
      )
    },
    { 
      key: "alat", 
      label: "Alat", 
      render: (p: Peminjaman) => (
        <div>
          <div className="font-medium">{p.alat?.nama_alat || "-"}</div>
          <div className="text-xs text-gray-500">{p.alat?.kode_alat || ""}</div>
        </div>
      )
    },
    { 
      key: "jumlah_pinjam", 
      label: "Jumlah",
      render: (p: Peminjaman) => (
        <span className="font-semibold">{p.jumlah_pinjam}</span>
      )
    },
    {
      key: "tanggal_pinjam",
      label: "Tgl Pinjam",
      render: (p: Peminjaman) =>
        p.tanggal_pinjam ? new Date(p.tanggal_pinjam).toLocaleDateString("id-ID") : "-"
    },
    {
      key: "tanggal_kembali",
      label: "Tgl Kembali",
      render: (p: Peminjaman) =>
        p.tanggal_kembali_rencana
          ? new Date(p.tanggal_kembali_rencana).toLocaleDateString("id-ID")
          : "-"
    },
    { 
      key: "status", 
      label: "Status", 
      render: (p: Peminjaman) => getStatusBadge(p.status) 
    },
    { 
      key: "keperluan", 
      label: "Keperluan", 
      render: (p: Peminjaman) => p.keperluan || "-" 
    },
    {
      key: "aksi",
      label: "Aksi",
      render: (p: Peminjaman) => (
        <button
          onClick={() => generatePDF(p)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak PDF
        </button>
      )
    },
  ]

  return (
    <>
      <Header title="Peminjaman Saya" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Riwayat Peminjaman</h2>
          <p className="text-sm text-muted-foreground">Daftar semua peminjaman Anda</p>
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