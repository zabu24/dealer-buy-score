'use client'

import { useState } from 'react'
import { AlertCircle, RotateCcw, Zap, FlaskConical, PenLine, FileUp, CheckCircle2 } from 'lucide-react'
import type { AnalysisInput } from '@/types/vehicle'
import { isValidVin } from '@/lib/utils'
import BillOfSaleUpload from './BillOfSaleUpload'

const EMPTY_FORM: AnalysisInput = {
  vin:            '',
  purchasePrice:  0,
  mileage:        0,
  zipCode:        '',
  conditionNotes: '',
  auctionFees:    0,
  transportCost:  0,
  reconBuffer:    0,
}

type Tab = 'manual' | 'upload'

interface Props {
  onSubmit:       (input: AnalysisInput) => void
  onLoadDemo:     () => void
  isLoading:      boolean
  initialValues?: AnalysisInput
}

export default function InputForm({ onSubmit, onLoadDemo, isLoading, initialValues }: Props) {
  const [tab, setTab]           = useState<Tab>('manual')
  const [form, setForm]         = useState<AnalysisInput>(initialValues ?? EMPTY_FORM)
  const [vinError, setVinError] = useState<string | null>(null)
  const [touched, setTouched]   = useState(false)
  const [extractedFor, setExtractedFor] = useState<string | null>(null)  // vehicle description after upload

  function set<K extends keyof AnalysisInput>(key: K, raw: string) {
    const isNum = ['purchasePrice', 'mileage', 'auctionFees', 'transportCost', 'reconBuffer'].includes(key)
    const value = isNum ? parseFloat(raw.replace(/,/g, '')) || 0 : raw
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'vin') {
      setVinError(raw.length > 0 && !isValidVin(raw) ? 'VIN must be exactly 17 alphanumeric characters' : null)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValidVin(form.vin)) {
      setVinError('Enter a valid 17-character VIN before analyzing')
      return
    }
    onSubmit(form)
  }

  function handleReset() {
    setForm(EMPTY_FORM)
    setVinError(null)
    setTouched(false)
    setExtractedFor(null)
    setTab('manual')
  }

  // Called by BillOfSaleUpload when extraction succeeds
  function handleExtracted(data: Partial<AnalysisInput>, vehicleDescription: string) {
    setForm(prev => ({ ...prev, ...data }))
    setExtractedFor(vehicleDescription)
    // Clear VIN error if a valid VIN came in
    if (data.vin && isValidVin(data.vin)) setVinError(null)
    setTab('manual')  // switch to manual so dealer can review & submit
  }

  const canSubmit = isValidVin(form.vin) && form.purchasePrice > 0 && !isLoading

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Vehicle Details</h2>
        <span className="text-xs text-slate-500">* Required</span>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
        <TabButton active={tab === 'manual'} onClick={() => setTab('manual')} icon={<PenLine className="w-3.5 h-3.5" />}>
          Manual Entry
        </TabButton>
        <TabButton active={tab === 'upload'} onClick={() => setTab('upload')} icon={<FileUp className="w-3.5 h-3.5" />}>
          Upload Bill of Sale
        </TabButton>
      </div>

      {/* ── Upload tab ───────────────────────────────────────────────────── */}
      {tab === 'upload' && (
        <BillOfSaleUpload onExtracted={handleExtracted} />
      )}

      {/* ── Manual tab ───────────────────────────────────────────────────── */}
      {tab === 'manual' && (
        <>
          {/* Extraction success banner */}
          {extractedFor && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-emerald-300 leading-tight">
                <span className="font-semibold">Fields extracted</span> from bill of sale
                {extractedFor && <span className="text-emerald-400/70"> — {extractedFor}</span>}
                <br />
                <span className="text-emerald-400/60">Review and adjust any values below before running the analysis.</span>
              </div>
            </div>
          )}

          {/* VIN — full width */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
              VIN <span className="text-blue-400">*</span>
            </label>
            <input
              type="text"
              maxLength={17}
              placeholder="e.g. 1FTFW1E54MFC12345"
              value={form.vin}
              onChange={e => set('vin', e.target.value.toUpperCase())}
              className={`
                w-full bg-slate-800 border rounded-lg px-4 py-2.5 font-mono text-sm text-white
                placeholder-slate-600 focus:outline-none focus:ring-2 transition-colors
                ${vinError
                  ? 'border-red-500/60 focus:ring-red-500/30'
                  : form.vin.length === 17
                  ? 'border-emerald-500/40 focus:ring-emerald-500/20'
                  : 'border-slate-700 focus:ring-blue-500/30'}
              `}
            />
            {vinError && (
              <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {vinError}
              </p>
            )}
            {form.vin.length === 17 && !vinError && (
              <p className="text-xs text-emerald-400 mt-1">✓ Valid VIN format</p>
            )}
          </div>

          {/* Two-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField
              label="Purchase Price"
              required
              value={form.purchasePrice}
              placeholder="28000"
              prefix="$"
              onChange={v => set('purchasePrice', v)}
              highlight={touched && form.purchasePrice === 0}
            />
            <NumberField
              label="Mileage"
              value={form.mileage}
              placeholder="47500"
              suffix="mi"
              onChange={v => set('mileage', v)}
            />
            <NumberField
              label="Auction Fees"
              value={form.auctionFees}
              placeholder="375"
              prefix="$"
              onChange={v => set('auctionFees', v)}
            />
            <NumberField
              label="Transport Cost"
              value={form.transportCost}
              placeholder="295"
              prefix="$"
              onChange={v => set('transportCost', v)}
            />
            <NumberField
              label="Recon Buffer"
              value={form.reconBuffer}
              placeholder="1200"
              prefix="$"
              onChange={v => set('reconBuffer', v)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
                ZIP / Region
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="30301"
                value={form.zipCode}
                onChange={e => set('zipCode', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Condition notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
              Condition Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Minor door ding, needs tires, clean interior, no dash lights..."
              value={form.conditionNotes}
              onChange={e => set('conditionNotes', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors resize-none"
            />
            <p className="text-xs text-slate-600">Mention any known issues — engine, body, interior, tires, etc.</p>
          </div>
        </>
      )}

      {/* Buttons — always visible */}
      {tab === 'manual' && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze Vehicle
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onLoadDemo}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Load Demo
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 font-medium text-sm rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      )}
    </form>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  active, onClick, icon, children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold
        transition-all duration-150
        ${active
          ? 'bg-slate-700 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-300'}
      `}
    >
      {icon}
      {children}
    </button>
  )
}

// ─── Reusable number field ────────────────────────────────────────────────────

interface NumberFieldProps {
  label:       string
  value:       number
  placeholder: string
  onChange:    (v: string) => void
  prefix?:     string
  suffix?:     string
  required?:   boolean
  highlight?:  boolean
}

function NumberField({ label, value, placeholder, onChange, prefix, suffix, required, highlight }: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label} {required && <span className="text-blue-400">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none">{prefix}</span>
        )}
        <input
          type="number"
          min={0}
          step="any"
          placeholder={placeholder}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className={`
            w-full bg-slate-800 border rounded-lg py-2.5 text-sm text-white
            placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors
            ${prefix ? 'pl-7 pr-4' : suffix ? 'pl-4 pr-10' : 'px-4'}
            ${highlight ? 'border-red-500/50' : 'border-slate-700'}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs select-none">{suffix}</span>
        )}
      </div>
    </div>
  )
}
