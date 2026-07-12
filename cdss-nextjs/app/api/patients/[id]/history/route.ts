import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = Number(id)

    const predictions = await prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        result: true,
        probability: true,
        riskLabel: true,
        glucose: true,
        bmi: true,
        bloodPressure: true,
        age: true,
        pregnancies: true,
        insulin: true,
        skinThickness: true,
        diabetesPedigreeFunction: true,
        recommendation: true,
        glucoseSummary: true,
        bmiSummary: true,
        bloodPressureSummary: true,
        ageSummary: true,
      },
    })

    return NextResponse.json(predictions)
  } catch (err: any) {
    console.error('[PATIENT HISTORY ERROR]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
