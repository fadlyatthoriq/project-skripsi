import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: rawId } = await params
    const id = Number(rawId)
    const { name, email } = await req.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nama dan email wajib diisi' },
        { status: 400 }
      )
    }

    // Cek email duplicate (exclude diri sendiri)
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah digunakan oleh pengguna lain' },
        { status: 409 }
      )
    }

    const patient = await prisma.user.update({
      where: { id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json(patient)
  } catch (err: any) {
    console.error('[PATIENT PUT ERROR]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/patients/[id] — hapus pasien beserta semua prediksinya (ADMIN only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: rawId } = await params
    const id = Number(rawId)

    // Hapus predictions dulu (karena ada foreign key), lalu hapus user
    await prisma.prediction.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[PATIENT DELETE ERROR]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
