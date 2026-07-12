import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// GET /api/history?search=&page=1&limit=10
// Mengembalikan daftar pasien (PATIENT) beserta info skrining terakhir mereka
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const page   = Math.max(1, Number(searchParams.get('page')  ?? 1))
    const limit  = Math.max(1, Number(searchParams.get('limit') ?? 10))
    const skip   = (page - 1) * limit

    const where: any = {
      role: 'PATIENT',
      predictions: { some: {} }, // hanya pasien yang sudah pernah skrining
    }

    if (search) {
      where.name = { contains: search }
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          predictions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              createdAt: true,
              result: true,
              probability: true,
              riskLabel: true,
            },
          },
          _count: { select: { predictions: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Flatten: ambil prediction terakhir sebagai field langsung
    const data = patients.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      totalScreenings: p._count.predictions,
      lastScreening: p.predictions[0] ?? null,
    }))

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    console.error('[HISTORY ERROR]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
