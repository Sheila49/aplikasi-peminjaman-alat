"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { Printer } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { pengembalianService } from "@/lib/services/pengembalian-service"
import type { Pengembalian } from "@/lib/types"

export default function PetugasPengembalianPage() {
  const [pengembalianList, setPengembalianList] = useState<Pengembalian[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await pengembalianService.getAll(page)
      setPengembalianList(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch (error) {
      toast.error("Gagal memuat data pengembalian")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const generateBuktiPengembalian = (pengembalian: Pengembalian) => {
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

    const formatTime = (dateString?: string) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    }

    const formatCurrency = (amount?: number) => {
      if (!amount) return 'Rp 0'
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
        <title>Bukti Pengembalian - ${pengembalian.id}</title>
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
          .table-row { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          .table-row:last-child { border-bottom: none; }
          .row-label { font-size: 11px; color: #64748b; }
          .row-value { font-size: 11px; color: #1e293b; font-weight: 600; }
          .row-main { font-size: 13px; font-weight: 700; color: #1e293b; }
          
          .denda-section { margin: 20px 30px; background: ${pengembalian.denda && pengembalian.denda > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${pengembalian.denda && pengembalian.denda > 0 ? '#fca5a5' : '#86efac'}; border-radius: 8px; padding: 15px 20px; }
          .denda-section h4 { font-size: 11px; color: ${pengembalian.denda && pengembalian.denda > 0 ? '#991b1b' : '#065f46'}; margin-bottom: 10px; font-weight: 600; }
          .denda-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 11px; border-bottom: 1px solid ${pengembalian.denda && pengembalian.denda > 0 ? '#fee2e2' : '#d1fae5'}; }
          .denda-row:last-child { border-bottom: none; }
          .denda-total { font-size: 14px; font-weight: 700; color: ${pengembalian.denda && pengembalian.denda > 0 ? '#dc2626' : '#059669'}; }
          
          .kondisi-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
          .kondisi-baik { background: #d1fae5; color: #065f46; }
          .kondisi-rusak { background: #fee2e2; color: #991b1b; }
          
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
                <h2>BUKTI PENGEMBALIAN</h2>
                <p class="subtitle">Invoice Pengembalian Alat</p>
              </div>
            </div>
            <div class="transaction-code">
              No. Transaksi: RETURN-${pengembalian.id.toString().padStart(6, '0')}
            </div>
          </div>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Tanggal Pengembalian</div>
              <div class="info-value">${formatDate(pengembalian.tanggal_kembali_aktual)} ${formatTime(pengembalian.tanggal_kembali_aktual)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Peminjam</div>
              <div class="info-value">${pengembalian.peminjaman?.peminjam?.nama_lengkap || '-'}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kategori</div>
              <div class="info-value">Pengembalian Alat Laboratorium</div>
            </div>
            <div class="info-row">
              <div class="info-label">Kondisi Alat</div>
              <div class="info-value">
                <span class="kondisi-badge ${pengembalian.kondisi_alat.toLowerCase() === 'baik' ? 'kondisi-baik' : 'kondisi-rusak'}">
                  ${pengembalian.kondisi_alat}
                </span>
              </div>
            </div>
          </div>

          <div class="transaction-table">
            <div class="table-header">
              <h3>DETAIL TRANSAKSI PENGEMBALIAN</h3>
            </div>
            <div class="table-row">
              <span class="row-label">Kode Alat</span>
              <span class="row-value">${pengembalian.peminjaman?.alat?.kode_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Nama Alat</span>
              <span class="row-main">${pengembalian.peminjaman?.alat?.nama_alat || '-'}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Dipinjam</span>
              <span class="row-value">${pengembalian.peminjaman?.jumlah_pinjam || 0} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Jumlah Dikembalikan</span>
              <span class="row-main">${pengembalian.jumlah_dikembalikan || 0} Unit</span>
            </div>
            <div class="table-row">
              <span class="row-label">Tanggal Pinjam</span>
              <span class="row-value">${formatDate(pengembalian.peminjaman?.tanggal_pinjam)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Batas Kembali</span>
              <span class="row-value">${formatDate(pengembalian.peminjaman?.tanggal_kembali_rencana)}</span>
            </div>
            <div class="table-row">
              <span class="row-label">Keterlambatan</span>
              <span class="row-value">${pengembalian.keterlambatan_hari || 0} Hari</span>
            </div>
          </div>

          <div class="denda-section">
            <h4>💰 RINCIAN DENDA & BIAYA</h4>
            <div class="denda-row">
              <span>Denda Keterlambatan (${pengembalian.keterlambatan_hari || 0} hari × Rp 10.000)</span>
              <span>${formatCurrency((pengembalian.keterlambatan_hari || 0) * 10000)}</span>
            </div>
            <div class="denda-row">
              <span>Denda Kerusakan Alat</span>
              <span>${pengembalian.kondisi_alat.toLowerCase() !== 'baik' ? 'Ditentukan Petugas' : 'Rp 0'}</span>
            </div>
            <div class="denda-row" style="border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 10px;">
              <span style="font-weight: 700;">TOTAL DENDA</span>
              <span class="denda-total">${formatCurrency(pengembalian.denda || 0)}</span>
            </div>
            ${pengembalian.kondisi_alat.toLowerCase() !== 'baik' ? `
              <div style="margin-top: 10px; padding: 10px; background: #fff7ed; border-radius: 6px; font-size: 10px; color: #9a3412;">
                ⚠️ <strong>Catatan:</strong> Denda kerusakan alat akan ditentukan oleh petugas berdasarkan tingkat kerusakan
              </div>
            ` : ''}
          </div>

          ${pengembalian.catatan ? `
          <div style="margin: 20px 30px; background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 15px 20px;">
            <h4 style="font-size: 11px; color: #854d0e; margin-bottom: 8px; font-weight: 600;">📝 Catatan</h4>
            <p style="font-size: 10px; color: #713f12; line-height: 1.5;">${pengembalian.catatan}</p>
          </div>
          ` : ''}

          <div class="footer">
            <div class="signature-section">
              <div class="signature-box">
                <div class="label">Peminjam</div>
                <div class="name">${pengembalian.peminjaman?.peminjam?.nama_lengkap || '-'}</div>
                <div class="role">Siswa/Guru</div>
              </div>
              <div class="signature-box">
                <div class="label">Petugas Laboratorium</div>
                <div class="name">________________</div>
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
          <button onclick="window.print()" style="padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 10px;">
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

  const getKondisiBadge = (kondisi: string) => {
    const isGood = kondisi.toLowerCase() === "baik"
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isGood ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        }`}
      >
        {kondisi}
      </span>
    )
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const columns = [
    { key: "id", label: "ID" },
    { 
      key: "peminjam", 
      label: "Peminjam",
      render: (p: Pengembalian) => p.peminjaman?.peminjam?.nama_lengkap || "-"
    },
    {
      key: "alat",
      label: "Alat",
      render: (p: Pengembalian) => p.peminjaman?.alat?.nama_alat || "-"
    },
    {
      key: "jumlah",
      label: "Jumlah",
      render: (p: Pengembalian) => `${p.jumlah_dikembalikan || 0} Unit`
    },
    {
      key: "tanggal_kembali_aktual",
      label: "Tgl Kembali",
      render: (p: Pengembalian) => new Date(p.tanggal_kembali_aktual).toLocaleDateString("id-ID"),
    },
    { 
      key: "keterlambatan",
      label: "Terlambat",
      render: (p: Pengembalian) => (
        <span className={p.keterlambatan_hari && p.keterlambatan_hari > 0 ? "text-red-600 font-semibold" : ""}>
          {p.keterlambatan_hari || 0} hari
        </span>
      )
    },
    { 
      key: "kondisi_alat", 
      label: "Kondisi", 
      render: (p: Pengembalian) => getKondisiBadge(p.kondisi_alat) 
    },
    {
      key: "denda",
      label: "Denda",
      render: (p: Pengembalian) => (
        <span className={p.denda && p.denda > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
          {formatCurrency(p.denda)}
        </span>
      )
    },
    {
      key: "actions",
      label: "Aksi",
      render: (p: Pengembalian) => (
        <button
          onClick={() => generateBuktiPengembalian(p)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20"
        >
          <Printer className="h-3.5 w-3.5" />
          Cetak
        </button>
      )
    },
  ]

  return (
    <>
      <Header title="Monitor Pengembalian" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Daftar Pengembalian</h2>
          <p className="text-sm text-muted-foreground">Monitor semua pengembalian alat & denda</p>
        </div>

        <DataTable
          columns={columns}
          data={pengembalianList}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </>
  )
}