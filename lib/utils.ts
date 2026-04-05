import type { Decision, Confidence, RiskLevel } from '@/types/vehicle'

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatMileage(value: number): string {
  return new Intl.NumberFormat('en-US').format(value) + ' mi'
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%'
}

// ─── Decision / score helpers ─────────────────────────────────────────────────

export function getDecisionColors(decision: Decision) {
  switch (decision) {
    case 'BUY':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500 text-white',
        glow: 'shadow-emerald-500/20',
      }
    case 'PASS':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        badge: 'bg-red-500 text-white',
        glow: 'shadow-red-500/20',
      }
    case 'CONDITIONAL':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-500 text-white',
        glow: 'shadow-amber-500/20',
      }
  }
}

export function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 45) return 'text-amber-400'
  return 'text-red-400'
}

export function getScoreStrokeColor(score: number): string {
  if (score >= 70) return '#34d399'
  if (score >= 45) return '#fbbf24'
  return '#f87171'
}

export function getRiskColors(level: RiskLevel) {
  switch (level) {
    case 'LOW':    return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
    case 'MEDIUM': return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   }
    case 'HIGH':   return { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30'     }
  }
}

export function getConfidenceColors(level: Confidence) {
  switch (level) {
    case 'HIGH':   return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
    case 'MEDIUM': return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   }
    case 'LOW':    return { text: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30'   }
  }
}

// ─── VIN validation ───────────────────────────────────────────────────────────

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i

export function isValidVin(vin: string): boolean {
  return VIN_REGEX.test(vin.trim())
}

// ─── Unique ID ────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}
