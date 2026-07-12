import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/patients — ambil semua user dengan role PATIENT
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { predictions: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(patients)
  } catch (err: any) {
    console.error('[PATIENTS GET ERROR]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/patients — tambah pasien baru (role otomatis PATIENT)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)
    const patient = await prisma.user.create({
      data: { name, email, password: hashed, role: 'PATIENT' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (err: any) {
    console.error('[PATIENTS POST ERROR]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
