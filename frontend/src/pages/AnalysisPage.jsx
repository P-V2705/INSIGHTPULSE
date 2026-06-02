import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain, Play, CheckCircle, AlertCircle, Loader2,
  ChevronRight, Zap, MessageSquare, RotateCcw, Upload,
  BarChart3, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { startAnalysis, getAnalysisStatus, getAnalysisResults, analyzeText } from '../utils/api'
import { useApp } from '../context/AppContext'

const NLP_STEPS = [
  'Loading dataset...',
  'Cleaning text data...',
  'Tokenizing reviews...',
  'Removing stopwords...',
  'Lemmatizing tokens...',
  'Running VADER sentiment...',
  'Running TextBlob analysis...',
  'Detecting emotions...',
  'Extracting keywords...',
  'Building topic model...',
  'Generating AI summary...',
  'Predicting quality...',
  'Finalizing results...',
]

export default function AnalysisPage() {
  const navigate  = useNavigate()
  const { sessionId, uploadData, setAnalysisResults, resetSession } = useApp()

  const [status,       setStatus]      = useState('idle')
  const [stepIndex,    setStepIndex]   = useState(0)
  const [errorMsg,     setErrorMsg]    = useState('')
  const [maxRows,      setMaxRows]     = useState(2000)
  const [quickText,    setQuickText]   = useState('')
  const [quickResult,  setQuickResult] = useState(null)
  const [quickLoading, setQuickLoading]= useState(false)
  const [resetting,    setResetting]   = useState(false)

  // Column overrides — pre-filled from auto-detection, editable by user
  const [reviewCol, setReviewCol] = useState(
    uploadData?.detected_columns?.review_column || ''
  )
  const [ratingCol, setRatingCol] = useState(
    uploadData?.detected_columns?.rating_column || ''
  )

  // Sync whenever uploadData changes (e.g. after page navigation)
  useEffect(() => {
    if (uploadData?.detected_columns) {
      setReviewCol(uploadData.detected_columns.review_column || '')
      setRatingCol(uploadData.detected_columns.rating_column || '')
    }
  }, [uploadData])

  const allColumns = uploadData?.summary?.columns || []

  const pollRef = useRef(null)
  const stepRef = useRef(null)

  useEffect(() => () => {
    clearInterval(pollRef.current)
    clearInterval(stepRef.current)
  }, [])

  // ── Run analysis ────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!sessionId) { toast.error('Please upload a dataset first.'); return }
    setStatus('processing')
    setStepIndex(0)
    setErrorMsg('')

    stepRef.current = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, NLP_STEPS.length - 1))
    }, 1800)

    try {
      // Pass user-selected columns (or null to let backend auto-detect)
      const rc = reviewCol?.trim() || null
      const rt = ratingCol?.trim() || null
      await startAnalysis(sessionId, rc, rt, maxRows)

      pollRef.current = setInterval(async () => {
        try {
          const res = await getAnalysisStatus(sessionId)
          const s = res.data.status
          if (s === 'completed') {
            clearInterval(pollRef.current)
            clearInterval(stepRef.current)
            const results = await getAnalysisResults(sessionId)
            setAnalysisResults(results.data)
            setStatus('completed')
            toast.success('Analysis complete!')
          } else if (s === 'error') {
            clearInterval(pollRef.current)
            clearInterval(stepRef.current)
            setErrorMsg(res.data.error || 'Analysis failed.')
            setStatus('error')
            toast.error('Analysis failed.')
          }
        } catch { /* 202 still processing */ }
      }, 2000)
    } catch (e) {
      clearInterval(stepRef.current)
      setErrorMsg(e.message)
      setStatus('error')
      toast.error(e.message)
    }
  }

  // ── New analysis — reset everything and go back to upload ──────────────────
  const handleNewAnalysis = () => {
    setResetting(true)
    clearInterval(pollRef.current)
    clearInterval(stepRef.current)

    // Brief visual pause so the user sees the reset happening
    setTimeout(() => {
      resetSession()          // clears sessionId, uploadData, analysisResults in context
      setStatus('idle')
      setStepIndex(0)
      setErrorMsg('')
      setQuickText('')
      setQuickResult(null)
      setResetting(false)
      navigate('/upload')
      toast('Ready for a new dataset', { icon: '🔄' })
    }, 400)
  }

  // ── Quick single-text analyzer ─────────────────────────────────────────────
  const handleQuickAnalyze = async () => {
    if (!quickText.trim()) return
    setQuickLoading(true)
    try {
      const res = await analyzeText(quickText)
      setQuickResult(res.data)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setQuickLoading(false)
    }
  }

  const sentimentColor = label => {
    if (label === 'Positive') return 'text-emerald-400'
    if (label === 'Negative') return 'text-red-400'
    return 'text-amber-400'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">NLP Analysis Engine</h1>
          <p className="text-slate-400">Run the full AI pipeline on your uploaded dataset.</p>
        </div>
        {/* Show "New Analysis" button whenever a session exists */}
        {sessionId && status !== 'processing' && (
          <button
            onClick={handleNewAnalysis}
            disabled={resetting}
            className="btn-secondary text-sm shrink-0"
          >
            {resetting
              ? <><Loader2 size={14} className="animate-spin" /> Resetting…</>
              : <><RotateCcw size={14} /> New Analysis</>}
          </button>
        )}
      </div>

      {/* Session info */}
      {sessionId ? (
        <div className="card p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 font-medium truncate">
              {uploadData?.filename || 'Dataset loaded'}
            </p>
            <p className="text-xs text-slate-500">
              {uploadData?.summary?.total_rows?.toLocaleString()} rows
              {' · '}Session: {sessionId.slice(0, 8)}…
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-4 mb-6 border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            No dataset loaded.{' '}
            <button onClick={() => navigate('/upload')} className="underline hover:text-amber-200">
              Upload one first.
            </button>
          </p>
        </div>
      )}

      {/* Config + Run */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-200 mb-4">Analysis Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* Review column selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Review / Text Column
              {!reviewCol && (
                <span className="ml-2 text-amber-400">⚠ not detected — please select</span>
              )}
            </label>
            {allColumns.length > 0 ? (
              <select
                value={reviewCol}
                onChange={e => setReviewCol(e.target.value)}
                className={`input-field ${!reviewCol ? 'border-amber-500/50' : ''}`}
                disabled={status === 'processing'}
              >
                <option value="">— select column —</option>
                {allColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            ) : (
              <input
                value={reviewCol}
                onChange={e => setReviewCol(e.target.value)}
                placeholder="e.g. review_text"
                className="input-field"
                disabled={status === 'processing'}
              />
            )}
          </div>

          {/* Rating column selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Rating Column (optional)</label>
            {allColumns.length > 0 ? (
              <select
                value={ratingCol}
                onChange={e => setRatingCol(e.target.value)}
                className="input-field"
                disabled={status === 'processing'}
              >
                <option value="">None</option>
                {allColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            ) : (
              <input
                value={ratingCol}
                onChange={e => setRatingCol(e.target.value)}
                placeholder="e.g. rating (optional)"
                className="input-field"
                disabled={status === 'processing'}
              />
            )}
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Max Reviews to Analyze</label>
            <select
              value={maxRows}
              onChange={e => setMaxRows(Number(e.target.value))}
              className="input-field"
              disabled={status === 'processing'}
            >
              <option value={500}>500 (Fast)</option>
              <option value={1000}>1,000</option>
              <option value={2000}>2,000 (Recommended)</option>
              <option value={5000}>5,000 (Slow)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleStart}
              disabled={!sessionId || status === 'processing'}
              className="btn-primary w-full justify-center py-2.5"
            >
              {status === 'processing'
                ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                : <><Play size={16} /> Run Full Analysis</>}
            </button>
          </div>
        </div>
      </div>

      {/* Processing animation */}
      {status === 'processing' && (
        <div className="card p-8 mb-6 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
            <Brain size={28} className="text-brand-400 animate-pulse" />
          </div>
          <h3 className="font-semibold text-slate-100 mb-2">AI Engine Running</h3>
          <p className="text-sm text-brand-400 mb-6 font-mono">{NLP_STEPS[stepIndex]}</p>
          <div className="space-y-2 max-w-sm mx-auto">
            {NLP_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  i < stepIndex  ? 'bg-emerald-400' :
                  i === stepIndex ? 'bg-brand-400 animate-pulse' :
                  'bg-slate-700'
                }`} />
                <span className={i <= stepIndex ? 'text-slate-300' : 'text-slate-600'}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {status === 'completed' && (
        <div className="card p-6 mb-6 border-emerald-500/20 bg-emerald-500/5 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={20} className="text-emerald-400" />
            <span className="font-semibold text-emerald-300">Analysis Complete</span>
          </div>
          <p className="text-sm text-slate-400 mb-5">
            All NLP processing finished. View your interactive dashboard or start a fresh analysis
            with a different dataset.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              <BarChart3 size={16} /> View Dashboard
            </button>
            <button onClick={handleNewAnalysis} disabled={resetting} className="btn-secondary">
              {resetting
                ? <><Loader2 size={14} className="animate-spin" /> Resetting…</>
                : <><Upload size={14} /> Analyze New Dataset</>}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="card p-5 mb-6 border-red-500/20 bg-red-500/5 animate-slide-up">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300 mb-1">Analysis Failed</p>
              <p className="text-xs text-red-400/80">{errorMsg}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleStart} className="btn-primary text-sm">
              <RefreshCw size={14} /> Retry
            </button>
            <button onClick={handleNewAnalysis} className="btn-secondary text-sm">
              <Upload size={14} /> Upload Different Dataset
            </button>
          </div>
        </div>
      )}

      {/* Quick text analyzer */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-brand-400" />
          <h2 className="font-semibold text-slate-200">Quick Text Analyzer</h2>
          <span className="badge bg-brand-500/10 text-brand-400 border-brand-500/20 text-xs">Live</span>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Analyze any single review instantly — no dataset upload needed.
        </p>
        <textarea
          value={quickText}
          onChange={e => setQuickText(e.target.value)}
          placeholder="Paste a review here to analyze it instantly…"
          rows={4}
          className="input-field resize-none mb-3"
        />
        <button
          onClick={handleQuickAnalyze}
          disabled={!quickText.trim() || quickLoading}
          className="btn-primary text-sm"
        >
          {quickLoading
            ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
            : <><MessageSquare size={14} /> Analyze Text</>}
        </button>

        {quickResult && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
            {[
              { label: 'Sentiment',   value: quickResult.vader?.label,              color: sentimentColor(quickResult.vader?.label) },
              { label: 'Confidence',  value: `${quickResult.vader?.confidence}%`,   color: 'text-slate-100' },
              { label: 'Quality',     value: quickResult.quality?.quality,           color: 'text-brand-400' },
              { label: 'Fake Risk',   value: quickResult.fake_detection?.verdict,
                color: quickResult.fake_detection?.is_suspicious ? 'text-red-400' : 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800/60 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-4 bg-slate-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-2">Dominant Emotions</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(quickResult.emotions || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([emo, val]) => (
                    <span key={emo} className="px-2.5 py-1 bg-slate-700 rounded-lg text-xs text-slate-300 capitalize">
                      {emo} {val.toFixed(0)}%
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
