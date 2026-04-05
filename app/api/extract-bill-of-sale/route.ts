/**
 * POST /api/extract-bill-of-sale
 *
 * Accepts a multipart/form-data upload containing a bill-of-sale
 * document (PDF or image) and returns structured vehicle + deal data.
 *
 * When ANTHROPIC_API_KEY is present, Claude reads the document directly.
 * Without a key the route returns realistic mock data so the UI still works.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export interface ExtractedBillData {
  vin:             string | null
  purchasePrice:   number | null
  mileage:         number | null
  zipCode:         string | null
  conditionNotes:  string | null
  auctionFees:     number | null
  transportCost:   number | null
  vehicleDescription: string   // "2021 Ford F-150 XLT" — display only
}

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

const EXTRACTION_PROMPT = `You are a vehicle data extraction specialist for a car dealership software tool.

Extract every piece of vehicle and transaction information from this bill of sale document.

Return ONLY a valid JSON object — no markdown fences, no explanation, no extra keys:
{
  "vin":                string | null,   // 17-character VIN, exactly as printed
  "purchasePrice":      number | null,   // total sale/purchase price in USD (digits only)
  "mileage":            number | null,   // odometer reading (digits only)
  "zipCode":            string | null,   // any ZIP code on the document
  "conditionNotes":     string | null,   // damage disclosures, as-is language, condition notes
  "auctionFees":        number | null,   // auction, buyer, or dealer fees (digits only)
  "transportCost":      number | null,   // transport / delivery cost (digits only)
  "vehicleDescription": string           // best-effort "YYYY Make Model Trim" from the document
}

Rules:
• Use null for any field not found in the document.
• Strip all $ signs, commas, and formatting from number fields.
• Summarise condition notes — include damage, "as-is" clauses, or any disclosures.
• vehicleDescription must always be a non-empty string — use "Unknown Vehicle" if nothing is found.`

export async function POST(req: NextRequest) {
  // ── Parse upload ──────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Could not parse form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Upload a PDF or image.` },
      { status: 415 }
    )
  }

  const bytes = await file.arrayBuffer()
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 413 })
  }

  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type as Anthropic.Base64ImageSource['media_type'] | 'application/pdf'

  // ── No API key → return mock data ─────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: true, data: getMockData(), mock: true })
  }

  // ── Call Claude ───────────────────────────────────────────────────────────
  const client = new Anthropic({ apiKey })

  // Claude supports PDFs as "document" blocks and images as "image" blocks
  const docBlock: Anthropic.MessageParam['content'][number] =
    mimeType === 'application/pdf'
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        } as unknown as Anthropic.DocumentBlockParam
      : {
          type: 'image',
          source: { type: 'base64', media_type: mimeType as Anthropic.Base64ImageSource['media_type'], data: base64 },
        }

  try {
    const message = await client.messages.create({
      model:      'claude-3-5-haiku-20241022',  // fast + cheap for structured extraction
      max_tokens: 1024,
      messages: [{
        role:    'user',
        content: [
          docBlock,
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let parsed: ExtractedBillData
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Claude occasionally wraps JSON in backticks — strip them
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      parsed = JSON.parse(cleaned)
    }

    return NextResponse.json({ success: true, data: parsed, mock: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Extraction failed', detail: message }, { status: 502 })
  }
}

// ── Mock data (no API key) ────────────────────────────────────────────────────
// TODO: Remove once ANTHROPIC_API_KEY is configured in .env.local

function getMockData(): ExtractedBillData {
  return {
    vin:                '1FTFW1E54MFC12345',
    purchasePrice:      28000,
    mileage:            47500,
    zipCode:            '30301',
    conditionNotes:     'Minor door ding on passenger side, needs new tires, interior clean, no dash lights. Sold as-is.',
    auctionFees:        375,
    transportCost:      295,
    vehicleDescription: '2021 Ford F-150 XLT',
  }
}
