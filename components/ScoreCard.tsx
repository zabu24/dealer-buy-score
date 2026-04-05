'use client'

import { getScoreColor, getScoreStrokeColor } from '@/lib/utils'
import type { Decision, VehicleInfo } from '@/types/vehicle'

interface Props {
  score:    number
  decision: Decision
  vehicle:  VehicleInfo
  vin:      string
}

export default function ScoreCard({ score, decision, vehicle, vin }: Props) {
  // SVG arc parameters
  const R          = 54
  const CIRCUMFERENCE = 2 * Math.PI * R
  const ARC_RATIO   = 0.72  // how much of the circle to use (72% = ~260°)
  const arcLength   = CIRCUMFERENCE * ARC_RATIO
  const gap         = CIRCUMFERENCE - arcLength
  const filled      = arcLength * (score / 100)
  const empty       = arcLength - filled
  const strokeColor = getScoreStrokeColor(score)
  const textColor   = getScoreColor(score)

  // Rotate so arc starts bottom-left and ends bottom-right
  const rotation = 90 + (360 * (1 - ARC_RATIO)) / 2

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4 animate-slide-up">
      {/* Vehicle identity */}
      <div className="text-center">
        <p className="text-white font-semibold text-lg leading-tight">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="text-slate-400 text-sm mt-0.5">{vehicle.trim}</p>
        <p className="text-slate-600 font-mono text-xs mt-1">{vin}</p>
      </div>

      {/* Circular score gauge */}
      <div className="relative w-36 h-36">
        <svg
          viewBox="0 0 128 128"
          className="w-full h-full -rotate-0"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Track */}
          <circle
            cx="64" cy="64" r={R}
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${gap}`}
          />
          {/* Fill */}
          <circle
            cx="64" cy="64" r={R}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${empty + gap}`}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 6px ${strokeColor}60)` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black tabular-nums ${textColor}`}>{score}</span>
          <span className="text-slate-500 text-[10px] uppercase tracking-widest mt-0.5">Score</span>
        </div>
      </div>

      {/* Score band label */}
      <p className="text-slate-400 text-xs text-center">
        {score >= 80 ? 'Exceptional opportunity' :
         score >= 65 ? 'Strong buy candidate' :
         score >= 50 ? 'Workable deal — verify details' :
         score >= 35 ? 'Below target — price concession needed' :
         'Poor risk/reward — pass recommended'}
      </p>
    </div>
  )
}
