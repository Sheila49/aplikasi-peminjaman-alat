import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  })

export const alatSchema = z.object({
  nama: z.string().min(2, "Nama alat minimal 2 karakter"),
  kategori_id: z.number().min(1, "Pilih kategori"),
  stok: z.number().min(0, "Stok tidak boleh negatif"),
  kondisi: z.string().min(1, "Kondisi harus diisi"),
  deskripsi: z.string().optional(),
})

export const kategoriSchema = z.object({
  nama: z.string().min(2, "Nama kategori minimal 2 karakter"),
  deskripsi: z.string().optional(),
})

export const peminjamanSchema = z.object({
  alat_id: z.number().min(1, "Pilih alat"),
  jumlah: z.number().min(1, "Jumlah minimal 1"),
  tanggal_pinjam: z.string().min(1, "Tanggal pinjam harus diisi"),
  tanggal_kembali: z.string().min(1, "Tanggal kembali harus diisi"),
  catatan: z.string().optional(),
})

export const pengembalianSchema = z.object({
  peminjaman_id: z.number().min(1, "Pilih peminjaman"),
  kondisi_alat: z.string().min(1, "Kondisi alat harus diisi"),
  catatan: z.string().optional(),
})

export const userSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum(["admin", "petugas", "peminjam"]),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type AlatFormData = z.infer<typeof alatSchema>
export type KategoriFormData = z.infer<typeof kategoriSchema>
export type PeminjamanFormData = z.infer<typeof peminjamanSchema>
export type PengembalianFormData = z.infer<typeof pengembalianSchema>
export type UserFormData = z.infer<typeof userSchema>
