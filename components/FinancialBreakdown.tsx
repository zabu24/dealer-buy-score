'use client'

import { DollarSign, TrendingUp, Wrench, Receipt, BarChart3, Percent, Gavel } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { AnalysisResult } from '@/types/vehicle'

interface Props {
  result: AnalysisResult
}

interface CardConfig {
  label:    string
  value:    string
  subtext?: string
  icon:     React.ElementType
  positive?: boolean | null  // true=green, false=red, null=neutral
  highlight?: boolean
}

export default function FinancialBreakdown({ result }: Props) {
  const {
    estimatedWholesaleValue,
    estimatedRetailValue,
    estimatedReconCost,
    totalInvestment,
    estimatedProfit,
    profitMargin,
    maxBid,
  } = result

  const cards: CardConfig[] = [
    {
      label:   'Est. Retail Value',
      value:   formatCurrency(estimatedRetailValue),
      subtext: 'Avg retail in your region',
      icon:    DollarSign,
      positive: null,
    },
    {
      label:   'Est. Wholesale Value',
      value:   formatCurrency(estimatedWholesaleValue),
      subtext: 'Dealer-to-dealer comp',
      icon:    TrendingUp,
      positive: null,
    },
    {
      label:   'Est. Recon Cost',
      value:   formatCurrency(estimatedReconCost),
      subtext: 'Parts + labor estimate',
      icon:    Wrench,
      positive: estimatedReconCost < 1000 ? true : estimatedReconCost > 2500 ? false : null,
    },
    {
      label:   'Total Investment',
      value:   formatCurrency(totalInvestment),
      subtext: 'Purchase + fees + transport + recon',
      icon:    Receipt,
      positive: null,
    },
    {
      label:    'Est. Gross Profit',
      value:    formatCurrency(estimatedProfit),
      subtext:  estimatedProfit >= 0 ? 'Before floor plan & overhead' : 'At current price — below water',
      icon:     BarChart3,
      positive: estimatedProfit > 2500 ? true : estimatedProfit < 0 ? false : null,
      highlight: true,
    },
    {
      label:    'Profit Margin',
      value:    formatPercent(profitMargin),
      subtext:  profitMargin >= 15 ? '≥ 15% target ✓' : profitMargin >= 8 ? 'Below 15% target' : '< 8% — danger zone',
      icon:     Percent,
      positive: profitMargin >= 15 ? true : profitMargin < 8 ? false : null,
      highlight: true,
    },
    {
      label:   'Max Bid',
      value:   formatCurrency(maxBid),
      subtext: 'To hit 15% gross margin floor',
      icon:    Gavel,
      positive: null,
      highlight: true,
    },
  ]

  return (
    <div className="space-y-3 animate-slide-up">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest px-1">Financial Breakdown</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map(card => (
          <FinancialCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  )
}

function FinancialCard({ label, value, subtext, icon: Icon, positive, highlight }: CardConfig) {
  const valueColor =
    positive === true  ? 'text-emerald-400' :
    positive === false ? 'text-red-400'     :
    'text-white'

  return (
    <div className={`
      bg-slate-900 border rounded-xl p-4 flex flex-col gap-2 transition-colors
      ${highlight ? 'border-slate-700' : 'border-slate-800'}
    `}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide leading-tight">{label}</span>
        <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
      </div>
      <p className={`text-xl font-bold tabular-nums leading-none ${valueColor}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-600 leading-tight">{subtext}</p>}
    </div>
  )
}
