'use client'

import { useState, useEffect, useRef } from 'react'
import { Car, ChevronRight } from 'lucide-react'

import InputForm           from '@/components/InputForm'
import ScoreCard           from '@/components/ScoreCard'
import DecisionPanel       from '@/components/DecisionPanel'
import FinancialBreakdown  from '@/components/FinancialBreakdown'
import AnalysisExplanation from '@/components/AnalysisExplanation'
import AnalysisHistory     from '@/components/AnalysisHistory'

import { analyzeVehicle, DEMO_INPUT } from '@/services/analyzeVehicle'
import { generateId } from '@/lib/utils'

import type { AnalysisInput, AnalysisResult, HistoryRecord } from '@/types/vehicle'

const HISTORY_KEY = 'dbs_history_v1'
const MAX_HISTORY = 20

export default function HomePage() {
  const [result,    setResult]    = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [history,   setHistory]   = useState<HistoryRecord[]>([])
  const [formKey,   setFormKey]   = useState(0)   // bump to reset InputForm
  const [demoInput, setDemoInput] = useState<AnalysisInput | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {
      // ignore corrupt data
    }
  }, [])

  function persistHistory(records: HistoryRecord[]) {
    setHistory(records)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(records))
    } catch {
      // storage full — silently skip
    }
  }

  async function handleAnalyze(input: AnalysisInput) {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeVehicle(input)
      setResult(data)

      // Prepend to history, trim to max
      const record: HistoryRecord = {
        id:              generateId(),
        vin:             data.vin,
        vehicle:         data.vehicle,
        purchasePrice:   input.purchasePrice,
        buyScore:        data.buyScore,
        decision:        data.decision,
        estimatedProfit: data.estimatedProfit,
        analyzedAt:      data.analyzedAt,
      }
      persistHistory([record, ...history].slice(0, MAX_HISTORY))

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleLoadDemo() {
    setDemoInput(DEMO_INPUT)
    setFormKey(k => k + 1)   // re-mount form with demo values pre-filled
    handleAnalyze(DEMO_INPUT)
  }

  function handleReset() {
    setFormKey(k => k + 1)
    setResult(null)
    setError(null)
    setDemoInput(null)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">Dealer Buy Score</h1>
              <p className="text-slate-500 text-xs mt-0.5">Auction Intelligence</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Mock Engine Active
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* ─── Hero ───────────────────────────────────────────────────────── */}
        <section className="text-center pt-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Dealer-Focused Buy/Pass Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Stop guessing at the block.
          </h2>
          <p className="text-slate-400 mt-3 text-base max-w-xl mx-auto leading-relaxed">
            Paste a VIN and get an instant scored recommendation — estimated retail, recon, profit margin, and a clear buy or pass.
          </p>
        </section>

        {/* ─── Main layout ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
          {/* Left: Input form */}
          <div className="lg:sticky lg:top-24">
            <InputForm
              key={formKey}
              onSubmit={handleAnalyze}
              onLoadDemo={handleLoadDemo}
              isLoading={isLoading}
              // Pass pre-filled demo values if available
              {...(demoInput ? { initialValues: demoInput } : {})}
            />
          </div>

          {/* Right: Results */}
          <div ref={resultsRef} className="space-y-5 min-h-[300px]">
            {/* Loading skeleton */}
            {isLoading && (
              <div className="space-y-5 animate-pulse">
                <div className="h-52 bg-slate-900 rounded-2xl border border-slate-800" />
                <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-900 rounded-xl border border-slate-800" />
                  ))}
                </div>
                <div className="h-48 bg-slate-900 rounded-2xl border border-slate-800" />
                <div className="flex items-center justify-center gap-3 text-slate-500 text-sm pt-4">
                  <span className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                  Decoding VIN and running market analysis…
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                <p className="text-red-400 font-semibold">Analysis Failed</p>
                <p className="text-slate-400 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Empty state */}
            {!result && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center text-center h-72 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-400 font-medium">No analysis yet</p>
                  <p className="text-slate-600 text-sm mt-1">Fill in the form and click <strong className="text-slate-400">Analyze Vehicle</strong>,<br />or try the <strong className="text-slate-400">Load Demo</strong> to see a sample result.</p>
                </div>
                <button
                  onClick={handleLoadDemo}
                  className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Load demo analysis
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Results */}
            {result && !isLoading && (
              <>
                {/* Score + Decision side by side on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
                  <ScoreCard
                    score={result.buyScore}
                    decision={result.decision}
                    vehicle={result.vehicle}
                    vin={result.vin}
                  />
                  <DecisionPanel
                    decision={result.decision}
                    confidence={result.confidence}
                    riskLevel={result.riskLevel}
                  />
                </div>

                <FinancialBreakdown result={result} />

                <AnalysisExplanation
                  summary={result.summary}
                  positives={result.positives}
                  risks={result.risks}
                  decision={result.decision}
                />
              </>
            )}
          </div>
        </section>

        {/* ─── History ────────────────────────────────────────────────────── */}
        <section>
          <AnalysisHistory
            records={history}
            onClear={() => {
              persistHistory([])
            }}
          />
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 mt-16 py-8 text-center text-xs text-slate-600">
        <p>Dealer Buy Score — MVP · All values are estimates for dealer decision support only.</p>
        <p className="mt-1 text-slate-700">
          {/* TODO: Add real disclaimer, terms, and data attribution when connecting live APIs */}
          Market data is mocked. Connect VIN, comps, and auction APIs for production use.
        </p>
      </footer>
    </div>
  )
}
