import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CDSS Diabetes — Deteksi Dini Risiko DMT2',
  description:
    'Sistem Pendukung Keputusan Klinis untuk deteksi dini risiko Diabetes Mellitus Tipe 2 menggunakan Machine Learning (Random Forest).',
  keywords: ['CDSS', 'diabetes', 'deteksi dini', 'machine learning', 'skrining'],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.className} h-full antialiased`}>
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
