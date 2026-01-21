// =======================
// User & Auth Types
// =======================
export type UserRole = "admin" | "petugas" | "peminjam"
export type KondisiAlat = "Baik" | "Rusak Ringan" | "Rusak Berat"
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
  peminjam?: User        // relasi ke user peminjam
  alat_id: number
  alat?: Alat            // relasi ke alat
  jumlah_pinjam: number
  tanggal_pengajuan?: string
  tanggal_pinjam?: string
  tanggal_kembali_rencana: string
  keperluan?: string
  status: StatusPeminjaman
  disetujui_oleh?: number
  penyetuju?: User       // relasi ke user penyetuju
  tanggal_persetujuan?: string
  catatan_persetujuan?: string
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
  ip_address?: string
  user_agent?: string
  created_at?: string
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