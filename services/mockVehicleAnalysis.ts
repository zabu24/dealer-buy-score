/**
 * Mock vehicle analysis engine.
 *
 * This service simulates what a real engine would do by:
 *  1. Decoding the VIN to extract make/model/year
 *  2. Looking up base market values for that vehicle
 *  3. Adjusting for mileage, condition, and region
 *  4. Calculating dealer financials
 *  5. Producing a buy score, decision, and AI-style explanation
 *
 * FUTURE INTEGRATION POINTS are marked with TODO comments throughout.
 */

import type {
  AnalysisInput,
  AnalysisResult,
  VehicleInfo,
  Decision,
  Confidence,
  RiskLevel,
} from '@/types/vehicle'

// ─── VIN Decoder ─────────────────────────────────────────────────────────────
// TODO: Replace with real VIN decoder API (e.g., NHTSA vPIC, Polk, or DataOne)

interface VehicleProfile {
  make: string
  models: string[]
  trims: string[]
  baseRetail: number   // rough 2–3 year old base retail MSRP proxy
  segment: 'economy' | 'midsize' | 'luxury' | 'truck' | 'suv' | 'ev'
}

const WMI_MAP: Record<string, VehicleProfile> = {
  // Ford
  '1FT': { make: 'Ford',          models: ['F-150', 'F-250', 'F-350'],              trims: ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum'],    baseRetail: 42000, segment: 'truck' },
  '1FA': { make: 'Ford',          models: ['Mustang', 'EcoSport'],                   trims: ['EcoBoost', 'GT', 'Mach 1', 'Shelby GT500'],          baseRetail: 34000, segment: 'midsize' },
  '1FM': { make: 'Ford',          models: ['Explorer', 'Expedition', 'Edge'],        trims: ['XLT', 'Limited', 'Platinum', 'ST'],                  baseRetail: 38000, segment: 'suv' },
  // GM / Chevrolet
  '1G1': { make: 'Chevrolet',     models: ['Malibu', 'Cruze', 'Spark'],              trims: ['LS', 'LT', 'Premier', 'RS'],                         baseRetail: 24000, segment: 'economy' },
  '1GC': { make: 'Chevrolet',     models: ['Silverado 1500', 'Silverado 2500'],      trims: ['WT', 'Custom', 'LT', 'LTZ', 'High Country'],         baseRetail: 41000, segment: 'truck' },
  '1GT': { make: 'GMC',           models: ['Sierra 1500', 'Sierra 2500'],            trims: ['Regular', 'SLE', 'SLT', 'Denali'],                   baseRetail: 43000, segment: 'truck' },
  '1G6': { make: 'Cadillac',      models: ['CT5', 'CT6', 'CTS'],                    trims: ['Luxury', 'Premium Luxury', 'V-Series'],              baseRetail: 52000, segment: 'luxury' },
  // Toyota
  '4T1': { make: 'Toyota',        models: ['Camry', 'Avalon'],                       trims: ['LE', 'SE', 'XSE', 'XLE', 'TRD'],                    baseRetail: 29000, segment: 'midsize' },
  '2T1': { make: 'Toyota',        models: ['Corolla'],                               trims: ['L', 'LE', 'SE', 'XSE', 'XLE'],                      baseRetail: 23000, segment: 'economy' },
  '5TD': { make: 'Toyota',        models: ['Sienna', 'Sequoia', 'Highlander'],       trims: ['L', 'LE', 'XLE', 'Platinum', 'Limited'],             baseRetail: 41000, segment: 'suv' },
  'JTD': { make: 'Toyota',        models: ['RAV4', 'Venza', 'Highlander'],           trims: ['LE', 'XLE', 'Adventure', 'TRD Off-Road', 'Limited'], baseRetail: 34000, segment: 'suv' },
  'JT2': { make: 'Toyota',        models: ['Supra', 'MR2'],                          trims: ['3.0', 'A91'],                                        baseRetail: 55000, segment: 'luxury' },
  // Honda
  '1HG': { make: 'Honda',         models: ['Civic', 'Accord'],                       trims: ['LX', 'Sport', 'EX', 'EX-L', 'Touring'],             baseRetail: 27000, segment: 'economy' },
  '2HG': { make: 'Honda',         models: ['CR-V', 'HR-V', 'Pilot'],                 trims: ['LX', 'EX', 'EX-L', 'Touring', 'Elite'],             baseRetail: 33000, segment: 'suv' },
  '5FN': { make: 'Honda',         models: ['Pilot', 'Passport', 'Ridgeline'],        trims: ['LX', 'EX', 'EX-L', 'TrailSport', 'Elite'],          baseRetail: 39000, segment: 'suv' },
  // Tesla
  '5YJ': { make: 'Tesla',         models: ['Model 3', 'Model S', 'Model X'],         trims: ['Standard Range', 'Long Range', 'Performance'],       baseRetail: 55000, segment: 'ev' },
  '7SA': { make: 'Tesla',         models: ['Model Y'],                               trims: ['Standard Range', 'Long Range', 'Performance'],       baseRetail: 48000, segment: 'ev' },
  // BMW
  'WBA': { make: 'BMW',           models: ['3 Series', '5 Series', '7 Series'],      trims: ['sDrive', 'xDrive', 'M Sport', 'M'],                  baseRetail: 54000, segment: 'luxury' },
  'WBS': { make: 'BMW',           models: ['M3', 'M4', 'M5'],                        trims: ['Base', 'Competition', 'CS'],                         baseRetail: 78000, segment: 'luxury' },
  // Mercedes-Benz
  'WDD': { make: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'S-Class'],         trims: ['Base', 'AMG Line', 'AMG 63'],                        baseRetail: 62000, segment: 'luxury' },
  'W1N': { make: 'Mercedes-Benz', models: ['GLE', 'GLC', 'GLS'],                    trims: ['300', '350', '450', 'AMG 53', 'AMG 63'],             baseRetail: 67000, segment: 'luxury' },
  // Chrysler / Dodge / Jeep / Ram
  '1C4': { make: 'Jeep',          models: ['Grand Cherokee', 'Wrangler', 'Compass'], trims: ['Sport', 'Altitude', 'Trailhawk', 'Limited', 'Rubicon', 'Summit'], baseRetail: 41000, segment: 'suv' },
  '1C6': { make: 'Ram',           models: ['1500', '2500', '3500'],                  trims: ['Tradesman', 'Big Horn', 'Rebel', 'Laramie', 'Limited', 'TRX'], baseRetail: 44000, segment: 'truck' },
  '2C3': { make: 'Dodge',         models: ['Charger', 'Challenger'],                 trims: ['SXT', 'GT', 'R/T', 'Scat Pack', 'SRT Hellcat'],     baseRetail: 38000, segment: 'midsize' },
  // Nissan
  '1N4': { make: 'Nissan',        models: ['Altima', 'Maxima', 'Sentra'],            trims: ['S', 'SV', 'SR', 'SL', 'Platinum'],                  baseRetail: 25000, segment: 'economy' },
  '5N1': { make: 'Nissan',        models: ['Pathfinder', 'Armada', 'Murano'],        trims: ['S', 'SV', 'SL', 'Platinum'],                        baseRetail: 38000, segment: 'suv' },
  // Hyundai / Kia
  'KMH': { make: 'Hyundai',       models: ['Sonata', 'Elantra', 'Tucson'],           trims: ['SE', 'SEL', 'N Line', 'Limited'],                   baseRetail: 27000, segment: 'economy' },
  '5NP': { make: 'Hyundai',       models: ['Sonata', 'Elantra'],                     trims: ['SE', 'SEL', 'N Line', 'Limited'],                   baseRetail: 26000, segment: 'economy' },
  'KNA': { make: 'Kia',           models: ['Sorento', 'Telluride', 'Sportage'],      trims: ['LX', 'S', 'EX', 'SX', 'SX Prestige'],              baseRetail: 32000, segment: 'suv' },
  'KND': { make: 'Kia',           models: ['Sportage', 'Soul'],                      trims: ['LX', 'S', 'EX', 'SX'],                              baseRetail: 28000, segment: 'suv' },
}

// VIN position 10 → model year
const YEAR_MAP: Record<string, string> = {
  A: '2010', B: '2011', C: '2012', D: '2013', E: '2014',
  F: '2015', G: '2016', H: '2017', J: '2018', K: '2019',
  L: '2020', M: '2021', N: '2022', P: '2023', R: '2024',
  S: '2025',
  // Pre-2010 (unlikely at dealer auction but included for completeness)
  '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005',
  '6': '2006', '7': '2007', '8': '2008', '9': '2009',
}

function decodeVin(vin: string): { vehicle: VehicleInfo; profile: VehicleProfile | null } {
  const upper = vin.toUpperCase().trim()
  const wmi3  = upper.substring(0, 3)
  const wmi2  = upper.substring(0, 2)
  const yearChar = upper[9] ?? ''

  // Try 3-char WMI first, fall back to 2-char prefix match
  let profile =
    WMI_MAP[wmi3] ??
    Object.entries(WMI_MAP).find(([k]) => k.startsWith(wmi2))?.[1] ??
    null

  const year  = YEAR_MAP[yearChar] ?? String(new Date().getFullYear() - 3)
  const model = profile ? pick(profile.models, upper.charCodeAt(5)) : 'Unknown Model'
  const trim  = profile ? pick(profile.trims, upper.charCodeAt(7))  : 'Base'
  const make  = profile?.make ?? 'Unknown Make'

  return {
    vehicle: { year, make, model, trim },
    profile,
  }
}

/** Deterministic pick from array using a seed value. */
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

// ─── Market value engine ──────────────────────────────────────────────────────
// TODO: Replace with real market comps API (e.g., Black Book, Manheim, CARFAX,
//       Autotrader Market Reports, or a custom ML model trained on auction data)

interface MarketValues {
  retail: number
  wholesale: number
}

function estimateMarketValues(
  profile: VehicleProfile | null,
  year: string,
  mileage: number,
  zipCode: string
): MarketValues {
  const currentYear = new Date().getFullYear()
  const vehicleYear = parseInt(year, 10) || currentYear - 3
  const age = currentYear - vehicleYear

  const base = profile?.baseRetail ?? 28000

  // Age-based depreciation (roughly 15–20% first year, 10–15% after)
  const ageDepreciation = Math.pow(0.85, Math.max(0, age))

  // Mileage adjustment: $0.08/mile over 15k/year average
  const avgMiles   = age * 15000
  const excessMiles = Math.max(0, mileage - avgMiles)
  const mileageAdj = excessMiles * 0.08

  // Regional multiplier
  // TODO: Replace with real regional pricing data keyed to zip code
  const zip3   = parseInt(zipCode.substring(0, 3), 10) || 500
  const regional = zip3 > 900 ? 1.06 : zip3 > 700 ? 1.03 : zip3 < 200 ? 1.04 : 1.0

  const retail    = Math.round((base * ageDepreciation - mileageAdj) * regional)
  const wholesale = Math.round(retail * 0.82) // typical dealer-to-dealer spread

  return {
    retail:    Math.max(retail, 6000),
    wholesale: Math.max(wholesale, 5000),
  }
}

// ─── Recon cost estimator ─────────────────────────────────────────────────────
// TODO: Replace with a condition-based estimator trained on actual recon invoices,
//       or integrate with a PDR / reconditioning vendor API

function estimateRecon(
  conditionNotes: string,
  mileage: number,
  profile: VehicleProfile | null
): number {
  const notes = conditionNotes.toLowerCase()

  let base = 600

  // Keyword bumps
  if (/engine|transmission|motor/.test(notes))  base += 2800
  if (/frame|structural|flood|fire/.test(notes)) base += 4500
  if (/body|dent|panel|bumper/.test(notes))      base += 600
  if (/paint|scratch|chip/.test(notes))          base += 350
  if (/tire|wheel|rim/.test(notes))              base += 900
  if (/interior|seat|carpet|torn/.test(notes))   base += 500
  if (/windshield|glass|crack/.test(notes))      base += 350
  if (/ac|heat|hvac|climate/.test(notes))        base += 800
  if (/brake|rotor|pad/.test(notes))             base += 450
  if (/rough|poor|damage/.test(notes))           base += 700

  // Mileage adds wear
  if (mileage > 100000) base += 400
  if (mileage > 150000) base += 600

  // Luxury segment bumps parts cost
  if (profile?.segment === 'luxury') base = Math.round(base * 1.4)
  if (profile?.segment === 'ev')     base = Math.round(base * 1.2)

  return Math.round(base / 50) * 50 // round to nearest $50
}

// ─── Scoring engine ───────────────────────────────────────────────────────────
// TODO: Replace with a trained ML model (e.g., gradient boosting on historical
//       auction outcomes) or an LLM-based scoring chain

function computeScore(
  profitMargin: number,
  estimatedProfit: number,
  mileage: number,
  reconCost: number,
  conditionNotes: string,
  riskLevel: RiskLevel
): number {
  // Base: profit margin drives 60% of score
  let score = Math.min(profitMargin * 2.8, 68)

  // Absolute profit floor guard (dealer needs at least $1,500 net)
  if (estimatedProfit < 1500) score -= 20
  else if (estimatedProfit > 6000) score += 8

  // Mileage deductions
  if (mileage > 150000) score -= 18
  else if (mileage > 100000) score -= 10
  else if (mileage < 30000) score += 6
  else if (mileage < 60000) score += 3

  // Recon penalty
  if (reconCost > 3000) score -= 12
  else if (reconCost > 1500) score -= 5

  // Condition note penalties
  const notes = conditionNotes.toLowerCase()
  if (/engine|transmission/.test(notes))   score -= 15
  if (/flood|fire|frame|structural/.test(notes)) score -= 20
  if (/salvage|rebuilt/.test(notes))       score -= 25

  // Risk adjustment
  if (riskLevel === 'HIGH')   score -= 10
  if (riskLevel === 'LOW')    score += 5

  return Math.round(Math.min(Math.max(score, 2), 98))
}

function deriveDecision(score: number): Decision {
  if (score >= 65) return 'BUY'
  if (score >= 42) return 'CONDITIONAL'
  return 'PASS'
}

function deriveConfidence(
  vin: string,
  profile: VehicleProfile | null,
  conditionNotes: string
): Confidence {
  let points = 0
  if (profile)                  points += 2
  if (conditionNotes.length > 20) points += 1
  if (vin.length === 17)         points += 1
  if (points >= 4) return 'HIGH'
  if (points >= 2) return 'MEDIUM'
  return 'LOW'
}

function deriveRisk(
  mileage: number,
  reconCost: number,
  conditionNotes: string,
  profitMargin: number
): RiskLevel {
  const notes = conditionNotes.toLowerCase()
  const redFlags = /engine|transmission|flood|fire|frame|structural|salvage|rebuilt/.test(notes)

  if (redFlags || mileage > 150000 || reconCost > 3500 || profitMargin < 5) return 'HIGH'
  if (mileage > 90000 || reconCost > 1500 || profitMargin < 12) return 'MEDIUM'
  return 'LOW'
}

// ─── AI explanation generator ─────────────────────────────────────────────────
// TODO: Replace with an LLM call (e.g., Claude, GPT-4o) using structured output.
//       Prompt should include market comps, vehicle history flags, and dealer margin targets.

function buildExplanation(
  vehicle: VehicleInfo,
  decision: Decision,
  score: number,
  profitMargin: number,
  estimatedProfit: number,
  mileage: number,
  reconCost: number,
  conditionNotes: string,
  totalInvestment: number,
  retailValue: number,
  maxBid: number,
  riskLevel: RiskLevel
): { summary: string; positives: string[]; risks: string[] } {
  const { year, make, model, trim } = vehicle
  const vehicle_str = `${year} ${make} ${model} ${trim}`
  const notes = conditionNotes.toLowerCase()

  const positives: string[] = []
  const risks: string[] = []

  // ── Positives ──
  if (profitMargin >= 20) positives.push(`Strong ${profitMargin.toFixed(1)}% margin — well above the 15% dealer target`)
  else if (profitMargin >= 12) positives.push(`Solid ${profitMargin.toFixed(1)}% gross margin with room for negotiation`)
  if (mileage < 50000) positives.push(`Low mileage (${mileage.toLocaleString()} mi) supports premium retail pricing`)
  else if (mileage < 80000) positives.push(`Mileage is within normal range for the model year`)
  if (estimatedProfit > 5000) positives.push(`Estimated gross profit of $${estimatedProfit.toLocaleString()} meets typical floor plan targets`)
  if (reconCost < 1000) positives.push(`Minimal recon required — unit should turn quickly`)
  if (make === 'Toyota' || make === 'Honda') positives.push(`${make} has strong used-car demand and fast turn rates in most markets`)
  if (make === 'Ford' && model.includes('F-1')) positives.push('F-Series trucks are the highest-volume used segment nationally')
  if (retailValue > totalInvestment * 1.25) positives.push(`Retail-to-investment spread of ${Math.round((retailValue / totalInvestment - 1) * 100)}% gives strong exit optionality`)
  if (score >= 80) positives.push('Buy score places this unit in the top tier of analyzed auction inventory')

  // ── Risks ──
  if (mileage > 120000) risks.push(`High mileage (${mileage.toLocaleString()} mi) will require CPO-grade disclosure and compress retail price`)
  else if (mileage > 80000) risks.push(`Above-average mileage may limit financing options for retail buyers`)
  if (reconCost > 2500) risks.push(`Recon estimate of $${reconCost.toLocaleString()} is elevated — verify before bidding`)
  if (/engine|transmission/.test(notes)) risks.push('Condition notes mention drivetrain concerns — mechanical inspection strongly advised')
  if (/flood|fire/.test(notes)) risks.push('Potential flood or fire damage flag — title history check is mandatory')
  if (/frame|structural/.test(notes)) risks.push('Structural damage noted — CARFAX and frame inspection required before purchase')
  if (profitMargin < 10 && profitMargin > 0) risks.push(`Thin margin (${profitMargin.toFixed(1)}%) leaves limited buffer for unexpected recon overruns`)
  if (estimatedProfit < 2000) risks.push('Projected gross profit is below $2,000 — floor plan carrying cost erodes profitability quickly')
  if (riskLevel === 'HIGH') risks.push('Overall risk profile is elevated — consider waiting for a cleaner unit unless price improves')

  // ── Summary ──
  let summary = ''
  if (decision === 'BUY') {
    summary = `The ${vehicle_str} presents a compelling auction opportunity at this price point. With an estimated gross of $${estimatedProfit.toLocaleString()} and a ${profitMargin.toFixed(1)}% margin, this unit clears the typical dealer profitability threshold. ${mileage < 75000 ? `Clean mileage and` : `Despite the higher miles,`} the retail-to-investment spread supports a confident buy recommendation. Max bid is set at ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(maxBid)} to preserve your target margin.`
  } else if (decision === 'CONDITIONAL') {
    summary = `The ${vehicle_str} is a conditional opportunity. The deal works at current pricing, but margin is thinner than ideal. ${reconCost > 1500 ? `Recon costs are a significant variable — confirm the scope before bidding.` : `Key factors to verify include condition details and regional comp accuracy.`} If you can negotiate the price down by 5–8% or confirm recon is at the low end of the estimate, this becomes a stronger buy. Proceed with caution and set a firm max bid.`
  } else {
    summary = `The ${vehicle_str} does not meet profitability thresholds at this price point. ${profitMargin < 5 ? `The margin is too thin to cover floor plan costs, reconditioning, and holding time.` : `Multiple risk factors combine to create an unfavorable risk/reward profile.`} Pass on this unit unless the seller reduces the price significantly or new market data improves the comp picture. Better inventory is available.`
  }

  return { summary, positives, risks }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runMockAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  // Simulate network/processing latency
  await new Promise(r => setTimeout(r, 1400 + Math.random() * 800))

  const { vehicle, profile } = decodeVin(input.vin)
  const { retail, wholesale } = estimateMarketValues(profile, vehicle.year, input.mileage, input.zipCode)

  const reconCost = estimateRecon(input.conditionNotes, input.mileage, profile)

  const totalInvestment =
    input.purchasePrice +
    input.auctionFees +
    input.transportCost +
    Math.max(reconCost, input.reconBuffer)

  const estimatedProfit = retail - totalInvestment
  const profitMargin    = totalInvestment > 0 ? (estimatedProfit / totalInvestment) * 100 : 0

  // Max bid: back into what you can pay to hit a 15% margin floor
  // TODO: Make target margin a dealer-configurable setting
  const TARGET_MARGIN = 0.15
  const maxBid = Math.round(
    (retail / (1 + TARGET_MARGIN) - input.auctionFees - input.transportCost - reconCost) / 50
  ) * 50

  const riskLevel  = deriveRisk(input.mileage, reconCost, input.conditionNotes, profitMargin)
  const score      = computeScore(profitMargin, estimatedProfit, input.mileage, reconCost, input.conditionNotes, riskLevel)
  const decision   = deriveDecision(score)
  const confidence = deriveConfidence(input.vin, profile, input.conditionNotes)

  const { summary, positives, risks } = buildExplanation(
    vehicle, decision, score, profitMargin, estimatedProfit,
    input.mileage, reconCost, input.conditionNotes, totalInvestment, retail, maxBid, riskLevel
  )

  return {
    vin: input.vin.toUpperCase(),
    vehicle,
    buyScore: score,
    decision,
    confidence,
    riskLevel,
    estimatedWholesaleValue: wholesale,
    estimatedRetailValue:    retail,
    estimatedReconCost:      reconCost,
    totalInvestment:         Math.round(totalInvestment),
    estimatedProfit:         Math.round(estimatedProfit),
    profitMargin:            Math.round(profitMargin * 10) / 10,
    maxBid:                  Math.max(maxBid, 0),
    summary,
    positives,
    risks,
    analyzedAt: new Date().toISOString(),
  }
}
