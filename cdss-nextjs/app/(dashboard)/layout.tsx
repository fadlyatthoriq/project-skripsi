'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaStethoscope, FaClipboardList, FaUser, FaSignOutAlt, FaUsers, FaShieldAlt } from 'react-icons/fa'

const NAV_ITEMS = [
  { href: '/screening', label: 'Skrining',  icon: <FaStethoscope />, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { href: '/history',   label: 'Riwayat',   icon: <FaClipboardList />, roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { href: '/patients',  label: 'Pasien',    icon: <FaUsers />,        roles: ['ADMIN'] },
  { href: '/profile',   label: 'Profil',    icon: <FaUser />,         roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
]

const ROLE_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ADMIN:  { label: 'Admin',   color: 'bg-purple-100 text-purple-700', icon: <FaShieldAlt className="text-xs" /> },
  DOCTOR: { label: 'Dokter',  color: 'bg-blue-100 text-blue-700',     icon: <FaUser className="text-xs" /> },
  NURSE:  { label: 'Perawat', color: 'bg-teal-100 text-teal-700',     icon: <FaUser className="text-xs" /> },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const userRole = (session?.user as any)?.role ?? ''
  const roleBadge = ROLE_BADGE[userRole]

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm">
              <FaStethoscope />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">CDSS Diabetes</p>
              <p className="text-xs text-slate-400">Deteksi Dini DMT2</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {visibleNav.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-slate-800 truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-slate-400 truncate mb-1.5">
              {session?.user?.email}
            </p>
            {roleBadge && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
                {roleBadge.icon}
                {roleBadge.label}
              </span>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                       text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <FaSignOutAlt />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}