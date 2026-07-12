'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  FaSearch, FaClipboardList, FaExclamationTriangle,
  FaCheckCircle, FaTimes, FaUser,
} from 'react-icons/fa'

interface LastScreening {
  id: number
  createdAt: string
  result: number
  probability: number
  riskLabel: string
}

interface PatientRow {
  id: number
  name: string
  email: string
  totalScreenings: number
  lastScreening: LastScreening | null
}

interface ApiResponse {
  data: PatientRow[]
  total: number
  page: number
  totalPages: number
}

interface PredictionDetail {
  id: number
  createdAt: string
  result: number
  probability: number
  riskLabel: string
  glucose: number
  bmi: number
  bloodPressure: number
  age: number
  recommendation: string
}

const LIMIT = 10

export default function HistoryPage() {
  const [patients, setPatients]       = useState<PatientRow[]>([])
  const [total, setTotal]             = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [page, setPage]               = useState(1)
  const [loading, setLoading]         = useState(true)

  // Search
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')

  // Modal Detail
  const [detailPatient, setDetailPatient]       = useState<PatientRow | null>(null)
  const [detailHistory, setDetailHistory]       = useState<PredictionDetail[]>([])
  const [detailLoading, setDetailLoading]       = useState(false)

  const fetchData = useCallback(async (p: number, s: string) => {
    setLoading(true)
    try {
      const res = await axios.get<ApiResponse>('/api/history', {
        params: { page: p, limit: LIMIT, search: s },
      })
      setPatients(res.data.data)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(page, search)
  }, [page, search, fetchData])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Buka modal detail
  const openDetail = async (patient: PatientRow) => {
    setDetailPatient(patient)
    setDetailLoading(true)
    setDetailHistory([])
    try {
      const res = await axios.get<PredictionDetail[]>(`/api/patients/${patient.id}/history`)
      setDetailHistory(res.data)
    } catch {
      /* noop */
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => setDetailPatient(null)

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <h1 className="text-xl font-semibold text-slate-800">Riwayat Skrining</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Daftar pasien yang telah menjalani skrining
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
              id="history-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama pasien..."
              className="w-full pl-9 pr-4 h-10 rounded-lg border border-slate-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-slate-800 placeholder:text-slate-400 bg-white"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-slate-500">
          {loading ? 'Memuat...' : `Menampilkan ${patients.length} dari ${total} pasien`}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pasien</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Jumlah Skrining</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Skrining Terakhir</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasil Terakhir</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <div className="flex justify-center mb-3 text-4xl text-slate-300">
                        <FaClipboardList />
                      </div>
                      <p className="text-sm font-medium">Belum ada riwayat skrining</p>
                      <p className="text-xs mt-1">Data akan muncul setelah pasien menjalani skrining</p>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient, idx) => {
                    const rowNum = (page - 1) * LIMIT + idx + 1
                    const ls = patient.lastScreening
                    const isRisk = ls?.result === 1
                    const dateStr = ls
                      ? new Date(ls.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'

                    return (
                      <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs">{rowNum}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold shrink-0">
                              {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{patient.name}</p>
                              <p className="text-xs text-slate-400">{patient.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                            {patient.totalScreenings}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{dateStr}</td>
                        <td className="px-4 py-3 text-center">
                          {ls ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                              ${isRisk
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                              {isRisk
                                ? <><FaExclamationTriangle className="text-xs" /> Berisiko</>
                                : <><FaCheckCircle className="text-xs" /> Tidak Berisiko</>
                              }
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            id={`btn-detail-${patient.id}`}
                            onClick={() => openDetail(patient)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700
                                       text-xs font-semibold transition-colors border border-blue-200"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  id="pagination-prev"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 h-8 rounded-lg border border-slate-300 text-sm font-medium text-slate-600
                             hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Sebelumnya
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                  const pg = start + i
                  if (pg > totalPages) return null
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                        ${pg === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {pg}
                    </button>
                  )
                })}
                <button
                  id="pagination-next"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 h-8 rounded-lg border border-slate-300 text-sm font-medium text-slate-600
                             hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Modal Detail Riwayat Pasien ===== */}
      {detailPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                  {detailPatient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{detailPatient.name}</p>
                  <p className="text-xs text-slate-400">{detailPatient.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                  {detailPatient.totalScreenings} skrining
                </span>
                <button
                  onClick={closeDetail}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6">
              {detailLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : detailHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FaUser className="mx-auto text-3xl mb-3 text-slate-300" />
                  <p className="text-sm">Belum ada riwayat skrining</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">No</th>
                        <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tanggal</th>
                        <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Glukosa</th>
                        <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">BMI</th>
                        <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">T. Darah</th>
                        <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usia</th>
                        <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Probabilitas</th>
                        <th className="text-center pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailHistory.map((pred, idx) => {
                        const isRisk = pred.result === 1
                        const date = new Date(pred.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                        return (
                          <tr key={pred.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 text-slate-400 text-xs pr-3">{idx + 1}</td>
                            <td className="py-3 text-slate-500 text-xs whitespace-nowrap pr-3">{date}</td>
                            <td className="py-3 text-right font-mono text-slate-700">{pred.glucose.toFixed(0)}</td>
                            <td className="py-3 text-right font-mono text-slate-700">{pred.bmi.toFixed(1)}</td>
                            <td className="py-3 text-right font-mono text-slate-700">{pred.bloodPressure.toFixed(0)}</td>
                            <td className="py-3 text-right font-mono text-slate-700">{pred.age}</td>
                            <td className="py-3 text-right">
                              <span className={`font-semibold font-mono ${
                                pred.probability >= 70 ? 'text-red-600' :
                                pred.probability >= 40 ? 'text-amber-600' :
                                'text-emerald-600'
                              }`}>
                                {pred.probability.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
                                ${isRisk
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                {isRisk
                                  ? <><FaExclamationTriangle className="text-xs" /> Berisiko</>
                                  : <><FaCheckCircle className="text-xs" /> Tidak Berisiko</>
                                }
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
              <p className="text-xs text-slate-400 text-center">
                Data diurutkan dari skrining terbaru ke terlama
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}