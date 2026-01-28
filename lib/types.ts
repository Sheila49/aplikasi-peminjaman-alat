// =======================
// User & Auth Types
// =======================
export type UserRole = "admin" | "petugas" | "peminjam"

// Kondisi yang benar-benar ada di database
export type KondisiAlat = "baik" | "rusak ringan" | "rusak berat"

// Kondisi filter di UI (tambahkan "all")
export type KondisiFilter = "all" | KondisiAlat

export type StatusPeminjaman = "diajukan" | "disetujui" | "ditolak" | "dipinjam" | "dikembalikan"

export interface User {
  id: number
  username: string
  nama_lengkap: string
  email: string
  role: UserRole
  no_telepon?: string
  alamat?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  nama_lengkap: string
  email: string
  password: string
  role: UserRole
  no_telepon?: string
  alamat?: string
}

// =======================
// Kategori Types
// =======================
export interface Kategori {
  id: number
  nama_kategori: string
  deskripsi?: string
  jumlah_alat?: number
  created_at?: string
  updated_at?: string
}

// =======================
// Alat / Aset Types
// =======================
export interface Alat {
  id: number
  kode_alat: string
  nama_alat: string
  kategori_id: number
  jumlah_total: number
  jumlah_tersedia: number
  kondisi: KondisiAlat
  lokasi_penyimpanan?: string
  deskripsi?: string
  gambar_url?: string
  kategori?: {
    id: number
    nama_kategori: string
  }
  created_at?: string
  updated_at?: string
}

// =======================
// Peminjaman Types
// =======================

export interface Peminjaman {
  id: number
  kode_peminjaman: string
  user_id: number
  peminjam?: User
  alat_id: number
  alat?: Alat
  jumlah_pinjam: number
  tanggal_pengajuan?: string
  tanggal_pinjam?: string
  tanggal_kembali_rencana: string
  keperluan?: string
  status: StatusPeminjaman
  disetujui_oleh?: number
  penyetuju?: User
  tanggal_persetujuan?: string
  
  // ✅ Field yang BENAR-BENAR ada di backend
  catatan_persetujuan?: string  // Digunakan untuk approve DAN reject
  
  // ❌ Field ini TIDAK ada di backend (hapus atau comment)
  // keterangan_penolakan?: string
  
  catatan?: string
  created_at?: string
  updated_at?: string
}


// =======================
// Pengembalian Types
// =======================
export interface Pengembalian {
  id: number
  peminjaman_id: number
  peminjaman?: Peminjaman
  tanggal_kembali_aktual: string
  kondisi_alat: string
  jumlah_dikembalikan?: number
  keterlambatan_hari?: number
  denda?: number
  catatan?: string
  diterima_oleh?: number
  created_at?: string
  updated_at?: string
  keterangan?: string
}

// =======================
// Log Aktivitas Types
// =======================
export interface LogAktivitas {
  id: number
  user_id: number
  user?: User
  aksi: string
  tabel: string
  data_id: number // bisa dianggap record_id
  keterangan?: string // bisa dianggap detail
  detail?: string // ✅ Alternative field name (beberapa backend pakai ini)
  ip_address?: string
  user_agent?: string
  created_at?: string
  record_id?: number
}

// =======================
// API Response Types
// =======================
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}