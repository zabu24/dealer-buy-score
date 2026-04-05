'use client'

import { Clock, Trash2 } from 'lucide-react'
import { formatCurrency, getDecisionColors } from '@/lib/utils'
import type { HistoryRecord } from '@/types/vehicle'

interface Props {
  records:   HistoryRecord[]
  onClear:   () => void
  onReload?: (id: string) => void
}

export default function AnalysisHistory({ records, onClear }: Props) {
  if (records.length === 0) return null

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Recent Analyses ({records.length})
        </h3>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear history
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-slate-800/50 border-b border-slate-800">
          {['VIN / Vehicle', 'Price', 'Decision', 'Profit', 'Date'].map(h => (
            <span key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/50">
          {records.map(rec => {
            const dc = getDecisionColors(rec.decision)
            return (
              <div
                key={rec.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center hover:bg-slate-800/30 transition-colors"
              >
                {/* VIN + vehicle */}
                <div>
                  <p className="font-mono text-xs text-slate-300">{rec.vin}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rec.vehicle.year} {rec.vehicle.make} {rec.vehicle.model}
                  </p>
                </div>

                {/* Price */}
                <span className="text-sm text-white tabular-nums font-medium">{formatCurrency(rec.purchasePrice)}</span>

                {/* Decision badge */}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${dc.bg} ${dc.border} ${dc.text}`}>
                  {rec.decision}
                </span>

                {/* Profit */}
                <span className={`text-sm tabular-nums font-semibold ${rec.estimatedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {rec.estimatedProfit >= 0 ? '+' : ''}{formatCurrency(rec.estimatedProfit)}
                </span>

                {/* Date */}
                <span className="text-xs text-slate-600 whitespace-nowrap">
                  {new Date(rec.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
