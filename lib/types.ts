// User types
export type UserRole = "admin" | "petugas" | "peminjam"

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
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
  name: string
  email: string
  password: string
  role?: UserRole
}

// Kategori types
export interface Kategori {
  id: number
  nama: string
  deskripsi?: string
  created_at?: string
  updated_at?: string
}

// Alat types
export interface Alat {
  id: number
  nama: string
  kategori_id: number
  kategori?: Kategori
  stok: number
  kondisi: string
  deskripsi?: string
  gambar?: string
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
