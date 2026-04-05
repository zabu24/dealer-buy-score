'use client'

import { ShieldCheck, ShieldAlert, ShieldX, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getDecisionColors, getRiskColors, getConfidenceColors } from '@/lib/utils'
import type { Decision, Confidence, RiskLevel } from '@/types/vehicle'

interface Props {
  decision:   Decision
  confidence: Confidence
  riskLevel:  RiskLevel
}

const DECISION_META = {
  BUY: {
    Icon:  ShieldCheck,
    label: 'BUY',
    desc:  'This unit meets your profitability criteria. Bid with confidence up to the max bid price.',
  },
  CONDITIONAL: {
    Icon:  ShieldAlert,
    label: 'CONDITIONAL',
    desc:  'This deal can work but has risk factors to verify. Stay disciplined on max bid.',
  },
  PASS: {
    Icon:  ShieldX,
    label: 'PASS',
    desc:  'Risk-adjusted return does not justify this price. Look for a better unit or a lower bid.',
  },
}

const RISK_META = {
  LOW:    { label: 'Low Risk',    Icon: TrendingUp   },
  MEDIUM: { label: 'Medium Risk', Icon: Minus        },
  HIGH:   { label: 'High Risk',   Icon: TrendingDown },
}

export default function DecisionPanel({ decision, confidence, riskLevel }: Props) {
  const dc   = getDecisionColors(decision)
  const rc   = getRiskColors(riskLevel)
  const cc   = getConfidenceColors(confidence)
  const meta = DECISION_META[decision]
  const { Icon } = meta
  const { Icon: RiskIcon } = RISK_META[riskLevel]

  return (
    <div className={`rounded-2xl border p-6 animate-slide-up ${dc.bg} ${dc.border}`}>
      {/* Main decision badge */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${dc.bg} border ${dc.border}`}>
          <Icon className={`w-5 h-5 ${dc.text}`} />
        </div>
        <div>
          <span className={`text-2xl font-black tracking-tight ${dc.text}`}>{meta.label}</span>
          <p className="text-slate-400 text-xs mt-0.5">Dealer Recommendation</p>
        </div>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed mb-5">{meta.desc}</p>

      {/* Confidence + Risk pills */}
      <div className="flex flex-wrap gap-3">
        {/* Confidence */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${cc.bg} ${cc.border} ${cc.text}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {confidence} Confidence
        </div>

        {/* Risk */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${rc.bg} ${rc.border} ${rc.text}`}>
          <RiskIcon className="w-3.5 h-3.5" />
          {RISK_META[riskLevel].label}
        </div>
      </div>
    </div>
  )
}
