'use client'

import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { getDecisionColors } from '@/lib/utils'
import type { Decision } from '@/types/vehicle'

interface Props {
  summary:   string
  positives: string[]
  risks:     string[]
  decision:  Decision
}

export default function AnalysisExplanation({ summary, positives, risks, decision }: Props) {
  const dc = getDecisionColors(decision)

  return (
    <div className="space-y-4 animate-slide-up">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest px-1">AI Deal Analysis</h3>

      {/* Summary */}
      <div className={`rounded-2xl border p-5 ${dc.bg} ${dc.border}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-1.5 rounded-lg ${dc.bg} border ${dc.border} flex-shrink-0`}>
            <Sparkles className={`w-4 h-4 ${dc.text}`} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Deal Summary</p>
            <p className="text-slate-200 text-sm leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>

      {/* Two-col grid: positives + risks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Positives */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Positive Factors ({positives.length})
          </p>
          {positives.length === 0 ? (
            <p className="text-slate-600 text-sm italic">No significant positives identified.</p>
          ) : (
            <ul className="space-y-2.5">
              {positives.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Risks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Risk Factors ({risks.length})
          </p>
          {risks.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No major risk factors identified.</p>
          ) : (
            <ul className="space-y-2.5">
              {risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
