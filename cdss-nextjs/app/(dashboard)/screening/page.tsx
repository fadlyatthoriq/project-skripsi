'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import {
  FaBaby, FaTint, FaHeartbeat, FaRulerVertical,
  FaSyringe, FaWeight, FaDna, FaBirthdayCake,
  FaSearch, FaExclamationTriangle, FaMicroscope,
} from 'react-icons/fa'

interface Patient {
  id: number
  name: string
  email: string
  role: string
}

interface FormData {
  pregnancies: string
  glucose: string
  blood_pressure: string
  skin_thickness: string
  insulin: string
  bmi: string
  diabetes_pedigree_function: string
  age: string
}

const INITIAL_FORM: FormData = {
  pregnancies: '',
  glucose: '',
  blood_pressure: '',
  skin_thickness: '',
  insulin: '',
  bmi: '',
  diabetes_pedigree_function: '',
  age: '',
}

const FIELDS = [
  {
    key: 'pregnancies',
    label: 'Jumlah Kehamilan',
    unit: 'kali',
    placeholder: '0',
    min: 0, max: 20, step: 1,
    hint: 'Masukkan 0 jika tidak pernah hamil',
    icon: <FaBaby />,
  },
  {
    key: 'glucose',
    label: 'Kadar Glukosa',
    unit: 'mg/dL',
    placeholder: '80–199',
    min: 0, max: 300, step: 0.1,
    hint: 'Kadar glukosa plasma 2 jam (OGTT)',
    icon: <FaTint />,
  },
  {
    key: 'blood_pressure',
    label: 'Tekanan Darah Diastolik',
    unit: 'mmHg',
    placeholder: '60–120',
    min: 0, max: 200, step: 1,
    hint: 'Tekanan darah bagian bawah (diastolik)',
    icon: <FaHeartbeat />,
  },
  {
    key: 'skin_thickness',
    label: 'Ketebalan Lipatan Kulit',
    unit: 'mm',
    placeholder: '0–99',
    min: 0, max: 150, step: 0.1,
    hint: 'Ketebalan lipatan kulit trisep',
    icon: <FaRulerVertical />,
  },
  {
    key: 'insulin',
    label: 'Kadar Insulin',
    unit: 'µU/mL',
    placeholder: '0–500',
    min: 0, max: 1000, step: 0.1,
    hint: 'Insulin serum 2 jam, masukkan 0 jika tidak diketahui',
    icon: <FaSyringe />,
  },
  {
    key: 'bmi',
    label: 'BMI (Indeks Massa Tubuh)',
    unit: 'kg/m²',
    placeholder: '15.0–60.0',
    min: 0, max: 100, step: 0.1,
    hint: 'Berat (kg) dibagi kuadrat tinggi (m)',
    icon: <FaWeight />,
  },
  {
    key: 'diabetes_pedigree_function',
    label: 'Diabetes Pedigree Function',
    unit: 'skor',
    placeholder: '0.078–2.420',
    min: 0, max: 5, step: 0.001,
    hint: 'Fungsi riwayat diabetes keluarga (0.078–2.420)',
    icon: <FaDna />,
  },
  {
    key: 'age',
    label: 'Usia',
    unit: 'tahun',
    placeholder: '21–81',
    min: 1, max: 120, step: 1,
    hint: 'Usia pasien dalam tahun',
    icon: <FaBirthdayCake />,
  },
]

export default function ScreeningPage() {
  const router = useRouter()

  // Patient selection
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Modal add patient
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  // Form data
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Load patients
  useEffect(() => {
    axios.get('/api/patients').then((r) => setPatients(r.data)).catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p)
    setSearch(p.name)
    setDropdownOpen(false)
  }

  // Add patient modal submit
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError('')
    setModalLoading(true)
    try {
      const res = await axios.post('/api/patients', {
        name: newName,
        email: newEmail,
        password: newPassword,
      })
      const created: Patient = res.data
      setPatients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedPatient(created)
      setSearch(created.name)
      setModalOpen(false)
      setNewName(''); setNewEmail(''); setNewPassword('')
    } catch (err: any) {
      setModalError(err?.response?.data?.error ?? 'Gagal menambah pasien')
    } finally {
      setModalLoading(false)
    }
  }

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    setSubmitError('')
    setSubmitting(true)

    try {
      const res = await axios.post('/api/predict', {
        patientId: selectedPatient.id,
        ...form,
      })

      // Simpan hasil ke sessionStorage untuk halaman result
      sessionStorage.setItem('predictionResult', JSON.stringify({
        ...res.data,
        patientName: selectedPatient.name,
        inputData: form,
      }))

      router.push('/screening/result')
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error ?? 'Gagal mengirim data. Pastikan Flask API berjalan.')
    } finally {
      setSubmitting(false)
    }
  }

  const isFormDisabled = !selectedPatient || submitting
  const isFormComplete = Object.values(form).every((v) => v !== '')

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <h1 className="text-xl font-semibold text-slate-800">Skrining Diabetes</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Masukkan parameter klinis pasien untuk deteksi risiko Diabetes Mellitus Tipe 2
        </p>
      </div>

      <div className="px-8 py-6 max-w-4xl">

        {/* Step 1: Pilih Pasien */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</div>
            <h2 className="text-base font-semibold text-slate-800">Pilih Pasien</h2>
          </div>

          <div className="flex gap-3 items-start">
            {/* Searchable dropdown */}
            <div className="flex-1 relative" ref={dropdownRef}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  <FaSearch />
                </span>
                <input
                  id="patient-search"
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSelectedPatient(null)
                    setDropdownOpen(true)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Cari nama atau email pasien..."
                  className="w-full pl-9 pr-4 h-10 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             text-slate-800 placeholder:text-slate-400 bg-white"
                />
              </div>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl
                                shadow-lg z-50 max-h-56 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                      Tidak ada pasien ditemukan
                    </div>
                  ) : (
                    filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50
                                   transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tombol tambah */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="h-10 px-4 rounded-lg border border-dashed border-blue-400 text-blue-600 text-sm font-medium
                         hover:bg-blue-50 transition-colors flex items-center gap-2 shrink-0"
            >
              <span>+</span> Tambah Pasien
            </button>
          </div>

          {/* Selected patient chip */}
          {selectedPatient && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">{selectedPatient.name}</p>
                <p className="text-xs text-blue-500">{selectedPatient.email}</p>
              </div>
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {selectedPatient.role}
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Parameter Klinis */}
        <form onSubmit={handleSubmit}>
          <div className={`bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm transition-opacity
                          ${!selectedPatient ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</div>
              <h2 className="text-base font-semibold text-slate-800">Parameter Klinis</h2>
              {!selectedPatient && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full ml-2 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" /> Pilih pasien terlebih dahulu
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FIELDS.map((field) => (
                <div key={field.key} className="group">
                  <label
                    htmlFor={`field-${field.key}`}
                    className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5"
                  >
                    <span className="text-slate-400">{field.icon}</span>
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      id={`field-${field.key}`}
                      type="number"
                      value={form[field.key as keyof FormData]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      disabled={isFormDisabled}
                      required
                      className="w-full h-10 pl-3 pr-16 rounded-lg border border-slate-300 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 text-slate-800 placeholder:text-slate-400 bg-white
                                 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                      {field.unit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{field.hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <span className="text-red-500 mt-0.5"><FaExclamationTriangle /></span>
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            id="btn-submit-screening"
            type="submit"
            disabled={!selectedPatient || !isFormComplete || submitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                       text-white text-sm font-semibold rounded-xl transition-colors
                       flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menganalisa...
              </>
            ) : (
              <>
                <FaMicroscope />
                Analisis Risiko Diabetes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Modal Tambah Pasien */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">Tambah Pasien Baru</h3>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setModalError('') }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  id="modal-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Budi Santoso"
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
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="pasien@email.com"
                  required
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  id="modal-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{modalError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setModalError('') }}
                  className="flex-1 h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  id="modal-submit-btn"
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                             text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Pasien'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}