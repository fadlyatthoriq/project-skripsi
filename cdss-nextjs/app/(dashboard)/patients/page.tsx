'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import {
  FaSearch, FaPlus, FaEdit, FaTrash,
  FaUsers, FaExclamationTriangle, FaTimes,
} from 'react-icons/fa'

interface Patient {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
  _count: { predictions: number }
}

type ModalMode = 'add' | 'edit'

interface ModalState {
  open: boolean
  mode: ModalMode
  patient: Patient | null
}

export default function PatientsPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const [patients, setPatients]   = useState<Patient[]>([])
  const [loading, setLoading]     = useState(true)
  const [searchInput, setSearchInput] = useState('')

  // Modal state (shared untuk Add & Edit)
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', patient: null })
  const [formName, setFormName]       = useState('')
  const [formEmail, setFormEmail]     = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formError, setFormError]     = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get<Patient[]>('/api/patients')
      setPatients(res.data)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      p.email.toLowerCase().includes(searchInput.toLowerCase())
  )

  // Buka modal tambah
  const openAdd = () => {
    setFormName(''); setFormEmail(''); setFormPassword(''); setFormError('')
    setModal({ open: true, mode: 'add', patient: null })
  }

  // Buka modal edit
  const openEdit = (p: Patient) => {
    setFormName(p.name); setFormEmail(p.email); setFormPassword(''); setFormError('')
    setModal({ open: true, mode: 'edit', patient: p })
  }

  const closeModal = () => {
    setModal({ open: false, mode: 'add', patient: null })
    setFormError('')
  }

  // Submit modal (add atau edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    try {
      if (modal.mode === 'add') {
        if (!formPassword) {
          setFormError('Password wajib diisi')
          return
        }
        await axios.post('/api/patients', {
          name: formName,
          email: formEmail,
          password: formPassword,
        })
      } else {
        await axios.put(`/api/patients/${modal.patient!.id}`, {
          name: formName,
          email: formEmail,
        })
      }
      closeModal()
      fetchPatients()
    } catch (err: any) {
      setFormError(err?.response?.data?.error ?? 'Terjadi kesalahan')
    } finally {
      setFormLoading(false)
    }
  }

  // Hapus pasien
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await axios.delete(`/api/patients/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetchPatients()
    } catch {
      /* noop */
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <h1 className="text-xl font-semibold text-slate-800">Manajemen Pasien</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola daftar pasien yang dapat menjalani skrining
        </p>
      </div>

      <div className="px-8 py-6">
        {/* Controls */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              <FaSearch />
            </span>
            <input
              id="patient-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-4 h-10 rounded-lg border border-slate-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-slate-800 placeholder:text-slate-400 bg-white"
            />
          </div>

          {isAdmin && (
            <button
              id="btn-add-patient"
              onClick={openAdd}
              className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                         transition-colors flex items-center gap-2"
            >
              <FaPlus className="text-xs" /> Tambah Pasien
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-slate-500">
          {loading ? 'Memuat...' : `Total ${filtered.length} pasien terdaftar`}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pasien</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Terdaftar</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Jumlah Skrining</th>
                  {isAdmin && (
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 animate-pulse">
                      {Array.from({ length: isAdmin ? 5 : 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center py-16 text-slate-400">
                      <div className="flex justify-center mb-3 text-4xl text-slate-300">
                        <FaUsers />
                      </div>
                      <p className="text-sm font-medium">Belum ada pasien terdaftar</p>
                      {isAdmin && (
                        <p className="text-xs mt-1">Klik "Tambah Pasien" untuk mendaftarkan pasien baru</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((patient, idx) => (
                    <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-semibold shrink-0">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{patient.name}</p>
                            <p className="text-xs text-slate-400">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(patient.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                          {patient._count.predictions}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              id={`btn-edit-${patient.id}`}
                              onClick={() => openEdit(patient)}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700
                                         flex items-center justify-center transition-colors border border-amber-200"
                              title="Edit pasien"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            <button
                              id={`btn-delete-${patient.id}`}
                              onClick={() => setDeleteTarget(patient)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600
                                         flex items-center justify-center transition-colors border border-red-200"
                              title="Hapus pasien"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== Modal Tambah / Edit Pasien (shared) ===== */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                {modal.mode === 'add' ? 'Tambah Pasien Baru' : 'Edit Data Pasien'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  id="modal-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama pasien"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  id="modal-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="pasien@email.com"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Password hanya muncul saat tambah */}
              {modal.mode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    id="modal-password"
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    required
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               text-slate-800 placeholder:text-slate-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Password ini tidak digunakan untuk login karena pasien tidak bisa login
                  </p>
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <FaExclamationTriangle className="text-red-500 text-xs shrink-0" />
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  id="modal-submit-btn"
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                             text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    modal.mode === 'add' ? 'Simpan Pasien' : 'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Konfirmasi Hapus ===== */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Hapus Pasien</p>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-5">
              Yakin ingin menghapus pasien{' '}
              <span className="font-semibold text-slate-800">{deleteTarget.name}</span>?
              Semua riwayat skrining pasien ini juga akan terhapus.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400
                           text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
