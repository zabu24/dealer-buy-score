// ─── Core domain types ────────────────────────────────────────────────────────

export interface VehicleInfo {
  year: string
  make: string
  model: string
  trim: string
}

export type Decision   = 'BUY' | 'PASS' | 'CONDITIONAL'
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH'
export type RiskLevel  = 'LOW' | 'MEDIUM' | 'HIGH'

/** Full output of one analysis run. */
export interface AnalysisResult {
  vin: string
  vehicle: VehicleInfo

  buyScore: number              // 0–100
  decision: Decision
  confidence: Confidence
  riskLevel: RiskLevel

  estimatedWholesaleValue: number
  estimatedRetailValue: number
  estimatedReconCost: number
  totalInvestment: number
  estimatedProfit: number
  profitMargin: number          // percentage
  maxBid: number

  summary: string
  positives: string[]
  risks: string[]

  analyzedAt: string            // ISO timestamp
}

// ─── Form inputs ──────────────────────────────────────────────────────────────

export interface AnalysisInput {
  vin: string
  purchasePrice: number
  mileage: number
  zipCode: string
  conditionNotes: string
  auctionFees: number
  transportCost: number
  reconBuffer: number
}

// ─── History record (stored in localStorage) ─────────────────────────────────

export interface HistoryRecord {
  id: string
  vin: string
  vehicle: VehicleInfo
  purchasePrice: number
  buyScore: number
  decision: Decision
  estimatedProfit: number
  analyzedAt: string
}
