import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import axios from 'axios'

const FLASK_URL = process.env.FLASK_API_URL || 'http://localhost:5000'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      patientId,
      pregnancies,
      glucose,
      blood_pressure,
      skin_thickness,
      insulin,
      bmi,
      diabetes_pedigree_function,
      age,
    } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId wajib diisi' }, { status: 400 })
    }

    // Forward ke Flask
    const flaskRes = await axios.post(`${FLASK_URL}/predict`, {
      pregnancies,
      glucose,
      blood_pressure,
      skin_thickness,
      insulin,
      bmi,
      diabetes_pedigree_function,
      age,
    })

    const {
      result,
      probability,
      risk_label,
      recommendation,
      clinical_summary,
    } = flaskRes.data

    // Simpan ke database
    const prediction = await prisma.prediction.create({
      data: {
        userId: Number(patientId),
        pregnancies: Number(pregnancies),
        glucose: Number(glucose),
        bloodPressure: Number(blood_pressure),
        skinThickness: Number(skin_thickness),
        insulin: Number(insulin),
        bmi: Number(bmi),
        diabetesPedigreeFunction: Number(diabetes_pedigree_function),
        age: Number(age),
        result: Number(result),
        probability: Number(probability),
        riskLabel: risk_label,
        recommendation,
        glucoseSummary: clinical_summary.glucose,
        bmiSummary: clinical_summary.bmi,
        bloodPressureSummary: clinical_summary.blood_pressure,
        ageSummary: clinical_summary.age,
      },
      include: { user: { select: { name: true, email: true } } },
    })

    return NextResponse.json({
      id: prediction.id,
      patientName: prediction.user.name,
      result,
      probability,
      risk_label,
      recommendation,
      clinical_summary,
    })
  } catch (err: any) {
    console.error('[PREDICT ERROR]', err?.response?.data ?? err.message)
    if (err?.response?.status) {
      return NextResponse.json(
        { error: err.response.data?.error ?? 'Flask error' },
        { status: err.response.status }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
