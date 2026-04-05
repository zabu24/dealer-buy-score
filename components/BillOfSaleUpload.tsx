'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import {
  Upload, FileText, ImageIcon, X, Loader2,
  CheckCircle2, AlertCircle, Sparkles, FileScan,
} from 'lucide-react'
import type { AnalysisInput } from '@/types/vehicle'
import type { ExtractedBillData } from '@/app/api/extract-bill-of-sale/route'

interface Props {
  onExtracted: (data: Partial<AnalysisInput>, vehicleDescription: string) => void
}

type UploadState =
  | { status: 'idle' }
  | { status: 'selected'; file: File }
  | { status: 'extracting'; file: File }
  | { status: 'success'; file: File; data: ExtractedBillData; mock: boolean }
  | { status: 'error'; file: File; message: string }

const ACCEPTED = '.pdf,image/jpeg,image/jpg,image/png,image/webp'
const MAX_MB   = 10

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function FileIcon({ type }: { type: string }) {
  return type === 'application/pdf'
    ? <FileText  className="w-5 h-5 text-red-400" />
    : <ImageIcon className="w-5 h-5 text-blue-400" />
}

export default function BillOfSaleUpload({ onExtracted }: Props) {
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── File selection ────────────────────────────────────────────────────────

  function pickFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      setState({ status: 'error', file, message: `File too large — max ${MAX_MB} MB` })
      return
    }
    setState({ status: 'selected', file })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) pickFile(file)
    e.target.value = ''   // allow re-selecting the same file
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) pickFile(file)
  }, [])

  const handleDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true)  }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false) }

  function reset() {
    setState({ status: 'idle' })
    setIsDragging(false)
  }

  // ── Extraction ────────────────────────────────────────────────────────────

  async function extract() {
    if (state.status !== 'selected' && state.status !== 'error') return
    const file = state.file

    setState({ status: 'extracting', file })

    try {
      const body = new FormData()
      body.append('file', file)

      const res = await fetch('/api/extract-bill-of-sale', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok) {
        setState({ status: 'error', file, message: json.error ?? 'Extraction failed' })
        return
      }

      setState({ status: 'success', file, data: json.data, mock: json.mock ?? false })
    } catch (err) {
      setState({
        status: 'error',
        file,
        message: err instanceof Error ? err.message : 'Network error — please try again',
      })
    }
  }

  function applyToForm() {
    if (state.status !== 'success') return
    const d = state.data

    const partial: Partial<AnalysisInput> = {
      ...(d.vin            ? { vin:            d.vin }            : {}),
      ...(d.purchasePrice  ? { purchasePrice:  d.purchasePrice }  : {}),
      ...(d.mileage        ? { mileage:        d.mileage }        : {}),
      ...(d.zipCode        ? { zipCode:        d.zipCode }        : {}),
      ...(d.conditionNotes ? { conditionNotes: d.conditionNotes } : {}),
      ...(d.auctionFees    ? { auctionFees:    d.auctionFees }    : {}),
      ...(d.transportCost  ? { transportCost:  d.transportCost }  : {}),
    }

    onExtracted(partial, d.vehicleDescription)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (state.status === 'idle') {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer
          transition-all duration-200 select-none
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleInputChange}
          className="sr-only"
        />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
          <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            {isDragging ? 'Drop file here' : 'Drop bill of sale here'}
          </p>
          <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, WEBP — up to {MAX_MB} MB</p>
        </div>
        <span className="text-xs text-blue-400 underline underline-offset-2">Browse files</span>
      </div>
    )
  }

  if (state.status === 'selected') {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
        <FilePreviewRow file={state.file} onRemove={reset} />
        <button
          onClick={extract}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
        >
          <FileScan className="w-4 h-4" />
          Extract Vehicle Data
        </button>
      </div>
    )
  }

  if (state.status === 'extracting') {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
        <FilePreviewRow file={state.file} />
        <div className="flex flex-col items-center gap-2 py-3 text-sm text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span>Reading document with AI…</span>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-4 space-y-4">
        <FilePreviewRow file={state.file} onRemove={reset} />
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {state.message}
        </div>
        <button
          onClick={extract}
          className="w-full text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg py-2 transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  // status === 'success'
  const { data, mock } = state
  const fields = buildFieldSummary(data)

  return (
    <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4 space-y-4">
      <FilePreviewRow file={state.file} onRemove={reset} />

      {/* Mock notice */}
      {mock && (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          No API key detected — showing demo extraction. Add <code className="mx-1 font-mono">ANTHROPIC_API_KEY</code> to <code className="font-mono">.env.local</code> for real extraction.
        </div>
      )}

      {/* Extracted fields preview */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Extracted {fields.length} field{fields.length !== 1 ? 's' : ''}
        </p>
        <div className="divide-y divide-slate-700/50 rounded-lg overflow-hidden border border-slate-700/50">
          {fields.map(f => (
            <div key={f.label} className="flex items-start justify-between gap-3 px-3 py-2 bg-slate-900/50">
              <span className="text-xs text-slate-500 uppercase tracking-wide whitespace-nowrap">{f.label}</span>
              <span className="text-xs text-slate-200 text-right font-medium truncate max-w-[60%]">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={applyToForm}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Apply to Form &amp; Review
      </button>
      <button onClick={reset} className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors py-1">
        Upload a different document
      </button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FilePreviewRow({ file, onRemove }: { file: File; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
        <FileIcon type={file.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 font-medium truncate">{file.name}</p>
        <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
      </div>
      {onRemove && (
        <button onClick={onRemove} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function buildFieldSummary(d: ExtractedBillData): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  if (d.vehicleDescription) rows.push({ label: 'Vehicle',      value: d.vehicleDescription })
  if (d.vin)                rows.push({ label: 'VIN',          value: d.vin })
  if (d.purchasePrice)      rows.push({ label: 'Sale Price',   value: `$${d.purchasePrice.toLocaleString()}` })
  if (d.mileage)            rows.push({ label: 'Odometer',     value: `${d.mileage.toLocaleString()} mi` })
  if (d.auctionFees)        rows.push({ label: 'Auction Fees', value: `$${d.auctionFees.toLocaleString()}` })
  if (d.transportCost)      rows.push({ label: 'Transport',    value: `$${d.transportCost.toLocaleString()}` })
  if (d.zipCode)            rows.push({ label: 'ZIP Code',     value: d.zipCode })
  if (d.conditionNotes)     rows.push({ label: 'Condition',    value: d.conditionNotes })
  return rows
}
