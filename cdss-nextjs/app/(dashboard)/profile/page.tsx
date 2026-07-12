'use client'

import { useSession, signOut } from 'next-auth/react'
import {
  FaShieldAlt, FaUserMd, FaUserNurse,
  FaUser, FaEnvelope, FaIdBadge, FaSignOutAlt,
} from 'react-icons/fa'

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ADMIN:  { label: 'Administrator', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: <FaShieldAlt /> },
  DOCTOR: { label: 'Dokter',        color: 'text-blue-700   bg-blue-50   border-blue-200',   icon: <FaUserMd /> },
  NURSE:  { label: 'Perawat',       color: 'text-teal-700   bg-teal-50   border-teal-200',   icon: <FaUserNurse /> },
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const user   = session?.user
  const role   = ROLE_LABELS[(user as any)?.role ?? ''] ?? ROLE_LABELS['NURSE']
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const detailItems = [
    { label: 'Nama Lengkap',   value: user?.name,  icon: <FaUser /> },
    { label: 'Email',          value: user?.email, icon: <FaEnvelope /> },
    { label: 'Role / Jabatan', value: role.label,  icon: role.icon },
    { label: 'ID Pengguna',    value: `#${(user as any)?.id ?? '–'}`, icon: <FaIdBadge /> },
  ]

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <h1 className="text-xl font-semibold text-slate-800">Profil Pengguna</h1>
        <p className="text-sm text-slate-500 mt-0.5">Informasi akun yang sedang aktif</p>
      </div>

      <div className="px-8 py-6 max-w-xl">

        {/* Avatar & Name Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-5">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-800 truncate">{user?.name ?? '–'}</h2>
              <p className="text-sm text-slate-500 truncate">{user?.email ?? '–'}</p>
              <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium border ${role.color}`}>
                <span className="text-xs">{role.icon}</span>
                {role.label}
              </span>
            </div>
          </div>
        </div>

        {/* Detail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Informasi Akun</p>
          </div>
          {detailItems.map((item) => (
            <div key={item.label} className="px-6 py-4 border-b border-slate-100 last:border-b-0 flex items-center gap-3">
              <span className="text-base text-slate-400">{item.icon}</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value ?? '–'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* System Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tentang Sistem</p>
          </div>
          {[
            { label: 'Nama Sistem',  value: 'CDSS Deteksi Risiko Diabetes Mellitus Tipe 2' },
            { label: 'Versi',        value: 'v1.0.0 (Prototipe)' },
            { label: 'Model ML',     value: 'Random Forest (AUC 0.9375, Acc 86.07%)' },
            { label: 'Institusi',    value: 'Universitas Global Jakarta, Teknik Informatika' },
            { label: 'Tahun',        value: '2025' },
          ].map((item) => (
            <div key={item.label} className="px-6 py-3.5 border-b border-slate-100 last:border-b-0 flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <p className="text-sm text-slate-700 mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          id="btn-logout"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full h-11 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold
                     hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2"
        >
          <FaSignOutAlt /> Keluar dari Sistem
        </button>
      </div>
    </div>
  )
}