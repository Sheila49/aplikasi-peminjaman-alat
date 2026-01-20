// User types
export type UserRole = "admin" | "petugas" | "peminjam"
export type KondisiAlat = "Baik" | "Rusak Ringan" | "Rusak Berat"


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


// Kategori types
export interface Kategori {
  id: number
  nama_kategori: string
  deskripsi?: string
  created_at?: string
  updated_at?: string
}

// Alat types
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

// Peminjaman types
export type StatusPeminjaman = "pending" | "approved" | "rejected" | "returned"

export interface Peminjaman {
  id: number
  user_id: number
  user?: User
  alat_id: number
  alat?: Alat
  jumlah: number
  tanggal_pinjam: string
  tanggal_kembali: string
  status: StatusPeminjaman
  catatan?: string
  created_at?: string
  updated_at?: string
}

// Pengembalian types
export interface Pengembalian {
  id: number
  peminjaman_id: number
  peminjaman?: Peminjaman
  tanggal_kembali_aktual: string
  kondisi_alat: string
  catatan?: string
  created_at?: string
  updated_at?: string
}

// Log Aktivitas types
export interface LogAktivitas {
  id: number
  user_id: number
  user?: User
  aksi: string
  tabel: string
  data_id: number
  keterangan?: string
  created_at?: string
}

// API Response types
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
