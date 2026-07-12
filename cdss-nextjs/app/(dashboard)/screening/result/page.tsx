'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FaTint, FaWeight, FaHeartbeat, FaBirthdayCake,
  FaExclamationTriangle, FaCheckCircle,
  FaMicroscope, FaClipboardList, FaChartBar,
  FaStethoscope,
} from 'react-icons/fa'

interface ClinicalSummary {
  glucose: string
  bmi: string
  blood_pressure: string
  age: string
}

interface PredictionResult {
  id: number
  patientName: string
  result: number
  probability: number
  risk_label: string
  recommendation: string
  clinical_summary: ClinicalSummary
  inputData: Record<string, string>
}

const CLINICAL_ICONS: Record<string, React.ReactNode> = {
  glucose:        <FaTint />,
  bmi:            <FaWeight />,
  blood_pressure: <FaHeartbeat />,
  age:            <FaBirthdayCake />,
}

const CLINICAL_LABELS: Record<string, string> = {
  glucose: 'Kadar Glukosa',
  bmi: 'Indeks Massa Tubuh',
  blood_pressure: 'Tekanan Darah',
  age: 'Usia',
}

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [animPct, setAnimPct] = useState(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('predictionResult')
    if (!raw) {
      router.replace('/screening')
      return
    }
    const data: PredictionResult = JSON.parse(raw)
    setResult(data)

    // Animate probability bar
    const timer = setTimeout(() => {
      setAnimPct(data.probability)
    }, 100)
    return () => clearTimeout(timer)
  }, [router])

  if (!result) return null

  const isRisk = result.result === 1
  const pct    = result.probability

  // Colour theme based on risk
  const theme = isRisk
    ? { badge: 'bg-red-100 text-red-700 border-red-300', bar: '#ef4444', icon: <FaExclamationTriangle />, glow: 'shadow-red-100' }
    : { badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bar: '#10b981', icon: <FaCheckCircle />, glow: 'shadow-emerald-100' }

  // Bar colour segmented
  const barColor =
    pct >= 70 ? '#ef4444' :
    pct >= 40 ? '#f59e0b' :
    '#10b981'

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Hasil Skrining</p>
          <h1 className="text-xl font-semibold text-slate-800">
            {result.patientName}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/history"
            className="h-9 px-4 rounded-lg border border-slate-300 text-sm font-medium text-slate-600
                       hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FaClipboardList /> Riwayat
          </Link>
          <Link
            id="btn-check-another"
            href="/screening"
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                       transition-colors flex items-center gap-2"
          >
            <FaStethoscope /> Periksa Pasien Lain
          </Link>
        </div>
      </div>

      <div className="px-8 py-6 max-w-3xl space-y-5">

        {/* Risk Badge Card */}
        <div className={`bg-white rounded-2xl border p-6 shadow-sm ${theme.glow} ${isRisk ? 'border-red-200' : 'border-emerald-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                            ${isRisk ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
              {theme.icon}
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Hasil Analisis ML</p>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${theme.badge}`}>
                {result.risk_label}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-800">{pct.toFixed(1)}%</p>
              <p className="text-xs text-slate-400">probabilitas risiko</p>
            </div>
          </div>

          {/* Probability bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Rendah</span>
              <span>Sedang</span>
              <span>Tinggi</span>
            </div>
            <div className="relative h-4 rounded-full bg-slate-100 overflow-hidden">
              {/* Segmented background */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-emerald-100/60" />
                <div className="w-px bg-slate-200" />
                <div className="flex-1 bg-amber-100/60" />
                <div className="w-px bg-slate-200" />
                <div className="flex-1 bg-red-100/60" />
              </div>
              {/* Animated fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${animPct}%`, backgroundColor: barColor }}
              />
              {/* Marker */}
              <div
                className="absolute top-0 bottom-0 w-1 rounded-full bg-white shadow-md transition-all duration-1000 ease-out"
                style={{ left: `calc(${animPct}% - 2px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>40%</span>
              <span>70%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Clinical Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FaMicroscope className="text-slate-400" /> Ringkasan Parameter Klinis
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(result.clinical_summary).map(([key, value]) => {
              // Parse "nilai — kategori"
              const [rawValue, ...rest] = value.split(' — ')
              const category = rest.join(' — ')
              return (
                <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xl mt-0.5 text-slate-400">
                    {CLINICAL_ICONS[key] ?? <FaChartBar />}
                  </span>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                      {CLINICAL_LABELS[key] ?? key}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{rawValue}</p>
                    <span className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                      {category}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-2xl border p-6 shadow-sm ${isRisk ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <h2 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isRisk ? 'text-red-800' : 'text-emerald-800'}`}>
            <FaClipboardList /> Rekomendasi Tindak Lanjut
          </h2>
          <p className={`text-sm leading-relaxed ${isRisk ? 'text-red-700' : 'text-emerald-700'}`}>
            {result.recommendation}
          </p>
        </div>

        {/* Input Data Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FaChartBar className="text-slate-400" /> Data Input Skrining
          </h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Kehamilan', value: result.inputData.pregnancies, unit: 'kali' },
              { label: 'Glukosa',   value: result.inputData.glucose,     unit: 'mg/dL' },
              { label: 'Tekanan Darah', value: result.inputData.blood_pressure, unit: 'mmHg' },
              { label: 'Kulit',     value: result.inputData.skin_thickness, unit: 'mm' },
              { label: 'Insulin',   value: result.inputData.insulin,     unit: 'µU/mL' },
              { label: 'BMI',       value: result.inputData.bmi,         unit: 'kg/m²' },
              { label: 'DPF',       value: result.inputData.diabetes_pedigree_function, unit: '' },
              { label: 'Usia',      value: result.inputData.age,         unit: 'th' },
            ].map((item) => (
              <div key={item.label} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                <p className="text-xs text-slate-400">{item.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center pb-6 flex items-center justify-center gap-1.5">
          <FaExclamationTriangle className="text-amber-400 shrink-0" />
          Hasil skrining ini bersifat pendukung keputusan klinis dan tidak menggantikan diagnosis dokter.
          Model Random Forest dengan AUC 0.9375, Accuracy 86.07%.
        </p>
      </div>
    </div>
  )
}
