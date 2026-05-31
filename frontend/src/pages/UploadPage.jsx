import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle, AlertCircle, ChevronRight,
  X, Table, Settings, Zap, HardDrive, Clock, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadFile, checkFileInfo } from '../utils/api'
import { useApp } from '../context/AppContext'
import clsx from 'clsx'

// ── File format config ────────────────────────────────────────────────────────
// We accept ALL MIME types (*) and validate by extension only.
// This is necessary because Windows browsers send inconsistent MIME types
// for Excel files (application/octet-stream, application/x-excel, etc.)
const ACCEPTED_EXTENSIONS = new Set([
  '.csv', '.xlsx', '.xls', '.tsv',
  '.json', '.txt',
  '.pdf', '.docx', '.doc',
])

// react-dropzone accept map — use extension-only keys so the OS file picker
// shows the right filter, but we never reject based on MIME type alone.
const ACCEPTED = {
  'text/csv':                                                                    ['.csv'],
  // Excel — all known MIME variants so Windows/Mac/Linux all work
  'application/vnd.ms-excel':                                                   ['.xls', '.xlsx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':          ['.xlsx'],
  'application/x-excel':                                                        ['.xls', '.xlsx'],
  'application/x-msexcel':                                                      ['.xls', '.xlsx'],
  'application/excel':                                                           ['.xls', '.xlsx'],
  'application/octet-stream':                                                    ['.xlsx', '.xls', '.csv'],
  // JSON
  'application/json':                                                            ['.json'],
  'text/json':                                                                   ['.json'],
  // PDF
  'application/pdf':                                                             ['.pdf'],
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':    ['.docx'],
  'application/msword':                                                          ['.doc', '.docx'],
  // Plain text / TSV
  'text/plain':                                                                  ['.txt', '.tsv', '.csv'],
  'text/tab-separated-values':                                                   ['.tsv'],
}

const FORMAT_GROUPS = [
  { label: 'Tabular',   formats: ['.csv', '.xlsx', '.xls', '.tsv'],  color: 'text-brand-400 bg-brand-500/10 border-brand-500/20' },
  { label: 'Document',  formats: ['.pdf', '.docx', '.doc'],           color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { label: 'Data',      formats: ['.json', '.txt'],                   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
]

// Icon by file type
function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase()
  const colors = {
    pdf:  'text-red-400',
    docx: 'text-blue-400', doc: 'text-blue-400',
    xlsx: 'text-emerald-400', xls: 'text-emerald-400',
    csv:  'text-brand-400',
    json: 'text-amber-400',
    txt:  'text-slate-400', tsv: 'text-slate-400',
  }
  return <FileText size={18} className={colors[ext] || 'text-brand-400'} />
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024)           return `${bytes} B`
  if (bytes < 1024 ** 2)      return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)      return `${(bytes / 1024 ** 2).toFixed(2)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatEta(sec) {
  if (sec === null || sec === undefined || !isFinite(sec)) return '—'
  if (sec < 60)  return `${Math.round(sec)}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
}

function formatSpeed(mbps) {
  if (!mbps || mbps <= 0) return '—'
  if (mbps < 1) return `${(mbps * 1024).toFixed(0)} KB/s`
  return `${mbps.toFixed(1)} MB/s`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UploadPage() {
  const navigate  = useNavigate()
  const { setSessionId, setUploadData } = useApp()

  const [file,       setFile]       = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [progress,   setProgress]   = useState(0)      // 0-100
  const [speed,      setSpeed]      = useState(0)      // MB/s
  const [eta,        setEta]        = useState(null)   // seconds
  const [uploaded,   setUploaded]   = useState(0)      // bytes sent so far
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)
  const [reviewCol,  setReviewCol]  = useState('')
  const [ratingCol,  setRatingCol]  = useState('')

  const abortRef = useRef(null)

  // ── Dropzone ────────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted, rejected) => {
    // react-dropzone may reject files with unknown MIME types (e.g. Excel on
    // some Windows browsers). Re-check by extension before showing an error.
    const allFiles = [
      ...accepted,
      ...rejected.map(r => r.file),
    ]

    if (allFiles.length === 0) return

    const f = allFiles[0]
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase()

    if (!ACCEPTED_EXTENSIONS.has(ext)) {
      toast.error(`"${ext}" is not supported. Use CSV, Excel, JSON, PDF, Word, or TXT.`)
      return
    }

    setFile(f)
    setResult(null)
    setError(null)
    setProgress(0)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    // Validate by extension in onDrop — never block based on MIME type alone
    validator: (file) => {
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
      if (!ACCEPTED_EXTENSIONS.has(ext)) {
        return { code: 'unsupported-type', message: `"${ext}" is not supported.` }
      }
      return null
    },
  })

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    setSpeed(0)
    setEta(null)
    setUploaded(0)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await uploadFile(
        file,
        (pct, spd, etaSec) => {
          setProgress(pct)
          setSpeed(spd)
          setEta(etaSec)
          setUploaded(Math.round((pct / 100) * file.size))
        },
        controller.signal,
      )

      const data = res.data
      setResult(data)
      setSessionId(data.session_id)
      setUploadData(data)
      setReviewCol(data.detected_columns?.review_column || '')
      setRatingCol(data.detected_columns?.rating_column || '')
      toast.success('Dataset uploaded successfully!')
    } catch (e) {
      if (e.name === 'CanceledError' || e.message?.includes('cancel')) {
        toast('Upload cancelled', { icon: '⚠️' })
      } else {
        setError(e.message)
        toast.error(e.message)
      }
    } finally {
      setUploading(false)
      abortRef.current = null
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
  }

  const handleProceed = () => navigate('/analysis')

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Upload Dataset</h1>
        <p className="text-slate-400">
          Import your review dataset — CSV, Excel, JSON, PDF, Word, TXT and more.
          <span className="ml-2 text-brand-400 font-medium">No file size limit.</span>
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-brand-500 bg-brand-500/5 scale-[1.01]'
            : 'border-slate-700 hover:border-brand-500/50 hover:bg-slate-900/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={clsx(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
            isDragActive ? 'bg-brand-500/20' : 'bg-slate-800'
          )}>
            <Upload size={28} className={isDragActive ? 'text-brand-400' : 'text-slate-400'} />
          </div>

          {isDragActive ? (
            <p className="text-brand-400 font-semibold text-lg">Drop your file here</p>
          ) : (
            <>
              <div>
                <p className="text-slate-200 font-medium mb-1">Drag & drop your dataset here</p>
                <p className="text-slate-500 text-sm">or click to browse files</p>
              </div>

              {/* Format groups */}
              <div className="flex flex-col items-center gap-2 w-full max-w-md">
                {FORMAT_GROUPS.map(({ label, formats, color }) => (
                  <div key={label} className="flex items-center gap-2 w-full">
                    <span className="text-xs text-slate-600 w-16 text-right shrink-0">{label}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {formats.map(ext => (
                        <span key={ext} className={`px-2 py-0.5 rounded-md text-xs font-mono border ${color}`}>
                          {ext}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* No size limit badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full">
                <HardDrive size={13} className="text-brand-400" />
                <span className="text-xs text-brand-300 font-medium">No file size limit — upload GB-scale datasets</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected file card */}
      {file && !result && (
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <FileIcon name={file.name} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploading ? (
                <button onClick={handleCancel} className="btn-ghost text-sm text-red-400 hover:text-red-300 gap-1.5">
                  <XCircle size={15} /> Cancel
                </button>
              ) : (
                <>
                  <button onClick={() => { setFile(null); setError(null) }} className="btn-ghost p-1.5">
                    <X size={16} />
                  </button>
                  <button onClick={handleUpload} className="btn-primary text-sm py-2">
                    <Upload size={14} /> Upload & Analyze
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress section */}
          {uploading && (
            <div className="mt-4 space-y-3">
              {/* Progress bar */}
              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
                {/* Shimmer overlay while uploading */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Progress</p>
                  <p className="text-base font-bold text-brand-400">{progress}%</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-0.5">Uploaded</p>
                  <p className="text-base font-bold text-slate-200">{formatBytes(uploaded)}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Zap size={10} className="text-slate-500" />
                    <p className="text-xs text-slate-500">Speed</p>
                  </div>
                  <p className="text-base font-bold text-slate-200">{formatSpeed(speed)}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Clock size={10} className="text-slate-500" />
                    <p className="text-xs text-slate-500">ETA</p>
                  </div>
                  <p className="text-base font-bold text-slate-200">{formatEta(eta)}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                {progress < 100
                  ? `Uploading ${formatBytes(uploaded)} of ${formatBytes(file.size)}…`
                  : 'Processing dataset — detecting columns and generating preview…'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 card p-4 border-red-500/20 bg-red-500/5 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Upload result */}
      {result && (
        <div className="mt-6 space-y-5 animate-slide-up">

          {/* Success banner */}
          <div className="card p-5 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={18} className="text-emerald-400" />
              <span className="font-semibold text-emerald-300">Dataset Uploaded Successfully</span>
              {result.file_size_mb && (
                <span className="ml-auto text-xs text-slate-500">{formatBytes(result.file_size_bytes)}</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Rows',   value: result.summary?.total_rows?.toLocaleString() },
                { label: 'Columns',      value: result.summary?.total_columns },
                { label: 'Avg Length',   value: result.summary?.avg_review_length ? `${result.summary.avg_review_length} chars` : '—' },
                { label: 'Avg Rating',   value: result.summary?.avg_rating ? `${result.summary.avg_rating}/5` : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-900/60 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-lg font-bold text-slate-100">{value ?? '—'}</p>
                </div>
              ))}
            </div>
            {result.summary?.large_file && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                <HardDrive size={13} />
                Large file detected — column detection used memory-efficient scanning.
              </div>
            )}
          </div>

          {/* Column configuration */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} className="text-slate-400" />
              <span className="font-medium text-slate-200">Column Configuration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Review / Text Column</label>
                <select value={reviewCol} onChange={e => setReviewCol(e.target.value)} className="input-field">
                  <option value="">Auto-detected</option>
                  {result.summary?.columns?.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Rating Column (optional)</label>
                <select value={ratingCol} onChange={e => setRatingCol(e.target.value)} className="input-field">
                  <option value="">None</option>
                  {result.summary?.columns?.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data preview */}
          {result.summary?.preview?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Table size={16} className="text-slate-400" />
                <span className="font-medium text-slate-200">Data Preview (first 5 rows)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {Object.keys(result.summary.preview[0]).map(col => (
                        <th key={col} className="text-left py-2 px-3 text-slate-400 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.summary.preview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-2 px-3 text-slate-300 max-w-xs truncate">
                            {String(val ?? '').slice(0, 80)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleProceed} className="btn-primary text-base px-7 py-3">
              Proceed to Analysis <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
