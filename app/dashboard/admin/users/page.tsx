"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Plus, Pencil, Trash2, Loader2, Search as SearchIcon, Filter, ArrowUpDown, X, ChevronDown } from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Modal } from "@/components/dashboard/modal"

import { userService } from "@/lib/services/user-service"
import { userSchema, type UserFormData } from "@/lib/validations"
import type { User } from "@/lib/types"

type RoleFilter = "all" | "admin" | "petugas" | "peminjam"
type SortField = "username" | "nama_lengkap" | "email" | "role"
type SortOrder = "asc" | "desc"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filter & Sort states
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [sortField, setSortField] = useState<SortField>("nama_lengkap")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

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
      setTotalPages(res.pagination.totalPages)
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

  /* ================= SEARCH, FILTER & SORT LOGIC ================= */
  const filteredAndSortedData = useMemo(() => {
    let result = [...users]

    // 1. SEARCH
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => {
        const username = item.username?.toLowerCase() || ""
        const namaLengkap = item.nama_lengkap?.toLowerCase() || ""
        const email = item.email?.toLowerCase() || ""
        const role = item.role?.toLowerCase() || ""
        const id = item.id?.toString() || ""
        
        return (
          id.includes(query) ||
          username.includes(query) ||
          namaLengkap.includes(query) ||
          email.includes(query) ||
          role.includes(query)
        )
      })
    }

    // 2. FILTER by Role
    if (roleFilter !== "all") {
      result = result.filter((item) => item.role === roleFilter)
    }

    // 3. SORT
    result.sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case "username":
          compareValue = (a.username || "").localeCompare(b.username || "")
          break
        case "nama_lengkap":
          compareValue = (a.nama_lengkap || "").localeCompare(b.nama_lengkap || "")
          break
        case "email":
          compareValue = (a.email || "").localeCompare(b.email || "")
          break
        case "role":
          compareValue = (a.role || "").localeCompare(b.role || "")
          break
      }

      return sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [users, searchQuery, roleFilter, sortField, sortOrder])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleRoleFilter = (role: RoleFilter) => {
    setRoleFilter(role)
    setIsRoleFilterOpen(false)
    setPage(1)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setIsSortOpen(false)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setSortField("nama_lengkap")
    setSortOrder("asc")
  }

  const hasActiveFilters = searchQuery || roleFilter !== "all"

  const openCreateModal = () => {
    setEditingUser(null)
    reset({
      username: "",
      nama_lengkap: "",
      email: "",
      password: "",
      role: "peminjam",
    })
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    reset({
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      role: user.role,
      password: "",
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true)
    try {
      if (editingUser) {
        const updateData: Partial<User> & { password?: string } = {
          username: data.username,
          nama_lengkap: data.nama_lengkap,
          email: data.email,
          role: data.role,
        }
        if (data.password) updateData.password = data.password
        await userService.update(editingUser.id, updateData)
        toast.success("User berhasil diperbarui")
      } else {
        await userService.create({
          username: data.username,
          nama_lengkap: data.nama_lengkap,
          email: data.email,
          password: data.password!,
          role: data.role,
        })
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

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-destructive/20 text-destructive border border-destructive/30",
      petugas: "bg-primary/20 text-primary border border-primary/30",
      peminjam: "bg-accent/20 text-accent border border-accent/30",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${styles[role] || ""}`}
      >
        {role}
      </span>
    )
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "username", label: "Username" },
    { key: "nama_lengkap", label: "Nama Lengkap" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (user: User) => getRoleBadge(user.role),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (user: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(user)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(user.id)}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Header 
        title="Manajemen Users"
        onSearch={handleSearch}
        searchValue={searchQuery}
        placeholder="Cari username, nama, email, role..."
      />

      <div className="p-6 animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Daftar Users</h2>
            <p className="mt-1 text-muted-foreground">Kelola semua pengguna sistem</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Tambah User
          </button>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Filter Role Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsRoleFilterOpen(!isRoleFilterOpen)
                  setIsSortOpen(false)
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  roleFilter !== "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-input/30 text-foreground hover:border-border"
                }`}
              >
                <Filter className="h-4 w-4" />
                Role
                {roleFilter !== "all" && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>

              {isRoleFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsRoleFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleRoleFilter("all")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        roleFilter === "all" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Semua Role
                    </button>
                    <button
                      onClick={() => handleRoleFilter("admin")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        roleFilter === "admin" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => handleRoleFilter("petugas")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        roleFilter === "petugas" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Petugas
                    </button>
                    <button
                      onClick={() => handleRoleFilter("peminjam")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        roleFilter === "peminjam" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Peminjam
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSortOpen(!isSortOpen)
                  setIsRoleFilterOpen(false)
                }}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-input/30 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-border"
              >
                <ArrowUpDown className="h-4 w-4" />
                Sort By
                <ChevronDown className="h-4 w-4" />
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-border/50 glass-strong p-2 shadow-xl animate-slide-up">
                    <button
                      onClick={() => handleSort("nama_lengkap")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "nama_lengkap" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Nama Lengkap {sortField === "nama_lengkap" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("username")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "username" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Username {sortField === "username" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("email")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "email" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Email {sortField === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      onClick={() => handleSort("role")}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        sortField === "role" ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary"
                      }`}
                    >
                      Role {sortField === "role" && (sortOrder === "asc" ? "↑" : "↓")}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-all duration-300 hover:bg-destructive/20"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>

          {/* Results Info */}
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-semibold text-foreground">{filteredAndSortedData.length}</span> dari{" "}
            <span className="font-semibold text-foreground">{users.length}</span> users
          </div>
        </div>

        {/* Search Result Info */}
        {searchQuery && (
          <div className="rounded-2xl glass border border-primary/20 p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Hasil Pencarian untuk "{searchQuery}"
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Menampilkan {filteredAndSortedData.length} dari {users.length} users
                </p>
              </div>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
              >
                Reset Pencarian
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchQuery && filteredAndSortedData.length === 0 && (
          <div className="rounded-2xl glass border border-border/30 p-12 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Tidak Ada Hasil</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tidak ditemukan user yang sesuai dengan "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:opacity-90"
            >
              Reset Pencarian
            </button>
          </div>
        )}

        {/* Data Table */}
        {(!searchQuery || filteredAndSortedData.length > 0) && (
          <DataTable
            columns={columns}
            data={filteredAndSortedData}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? "Edit User" : "Tambah User Baru"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username <span className="text-destructive">*</span>
              </label>
              <input
                {...register("username")}
                placeholder="e.g., johndoe"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.username && <p className="mt-1.5 text-xs text-destructive">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <input
                {...register("nama_lengkap")}
                placeholder="e.g., John Doe"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.nama_lengkap && <p className="mt-1.5 text-xs text-destructive">{errors.nama_lengkap.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="e.g., john@example.com"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password {editingUser ? <span className="text-muted-foreground text-xs">(kosongkan jika tidak diubah)</span> : <span className="text-destructive">*</span>}
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Masukkan password"}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role <span className="text-destructive">*</span>
              </label>
              <select
                {...register("role")}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="admin">Admin</option>
                <option value="petugas">Petugas</option>
                <option value="peminjam">Peminjam</option>
              </select>
              {errors.role && <p className="mt-1.5 text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl border-2 border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Menyimpan..." : editingUser ? "Simpan" : "Tambah"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}