/**
 * Top-level vehicle analysis orchestrator.
 *
 * Currently delegates to the mock engine. Swap the import below to route to
 * a real backend endpoint, LLM chain, or API gateway without touching any UI code.
 *
 * TODO: Replace runMockAnalysis with an API call when moving to production:
 *
 *   export async function analyzeVehicle(input: AnalysisInput): Promise<AnalysisResult> {
 *     const res = await fetch('/api/analyze', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(input),
 *     })
 *     if (!res.ok) throw new Error(await res.text())
 *     return res.json()
 *   }
 */

import type { AnalysisInput, AnalysisResult } from '@/types/vehicle'
import { runMockAnalysis } from './mockVehicleAnalysis'

export async function analyzeVehicle(input: AnalysisInput): Promise<AnalysisResult> {
  // TODO: Add auth token injection here when connecting to a real backend
  // TODO: Add request deduplication / caching layer here
  return runMockAnalysis(input)
}

// ─── Demo vehicle (Load Demo button) ─────────────────────────────────────────
// TODO: Replace with a curated set of real auction examples per dealer account

export const DEMO_INPUT: AnalysisInput = {
  vin:            '1FTFW1E54MFC12345',  // 2021 Ford F-150 XLT pattern
  purchasePrice:  28000,
  mileage:        47500,
  zipCode:        '30301',
  conditionNotes: 'Minor door ding on passenger side, needs new tires, interior is clean, no dash lights',
  auctionFees:    375,
  transportCost:  295,
  reconBuffer:    1200,
}
