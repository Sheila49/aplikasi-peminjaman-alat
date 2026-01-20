"use client"
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Modal } from "@/components/dashboard/modal"
import { userService } from "@/lib/services/user-service"
import { userSchema, type UserFormData } from "@/lib/validations"
import type { User } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await userService.getAll(page)
      setUsers(res.data)
      setTotalPages(res.totalPages)
    } catch (error) {
      toast.error("Gagal memuat data users")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreateModal = () => {
    setEditingUser(null)
    reset({ name: "", email: "", password: "", role: "peminjam" })
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    reset({ name: user.name, email: user.email, role: user.role, password: "" })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true)
    try {
      if (editingUser) {
        const updateData: Partial<User> & { password?: string } = {
          name: data.name,
          email: data.email,
          role: data.role,
        }
        if (data.password) updateData.password = data.password
        await userService.update(editingUser.id, updateData)
        toast.success("User berhasil diperbarui")
      } else {
        await userService.create({ ...data, password: data.password! })
        toast.success("User berhasil ditambahkan")
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error("Gagal menyimpan user")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) return
    try {
      await userService.delete(id)
      toast.success("User berhasil dihapus")
      fetchUsers()
    } catch (error) {
      toast.error("Gagal menghapus user")
      console.error(error)
    }
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nama" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (user: User) => (
        <span className="inline-flex items-center rounded-full gradient-primary px-3 py-1 text-xs font-medium capitalize text-primary-foreground">
          {user.role}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (user: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(user)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Header title="Manajemen Users" />
      <div className="p-6 animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Users</h2>
            <p className="mt-1 text-muted-foreground">Kelola semua pengguna sistem</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 glow-primary"
          >
            <Plus className="h-4 w-4" />
            Tambah User
          </button>
        </div>

        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? "Edit User" : "Tambah User"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-card-foreground">Nama</label>
              <input
                {...register("name")}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.name && <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">Email</label>
              <input
                {...register("email")}
                type="email"
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.email && <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">
                Password {editingUser && "(kosongkan jika tidak diubah)"}
              </label>
              <input
                {...register("password")}
                type="password"
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              />
              {errors.password && (
                <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-card-foreground">Role</label>
              <select
                {...register("role")}
                className="mt-2 w-full rounded-2xl border border-border/50 bg-input/30 px-4 py-3 text-sm text-foreground transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border"
              >
                <option value="admin">Admin</option>
                <option value="petugas">Petugas</option>
                <option value="peminjam">Peminjam</option>
              </select>
              {errors.role && <p className="mt-2 text-xs text-destructive animate-fade-in">{errors.role.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border border-border/50 px-5 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-2xl gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-50 glow-primary"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingUser ? "Simpan" : "Tambah"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
