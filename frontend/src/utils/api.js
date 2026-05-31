import axios from 'axios'

// In production (Netlify) __API_BASE__ is injected by Vite as the backend URL.
// In development the Vite proxy rewrites /api → localhost:8000, so baseURL stays '/api'.
const BASE_URL =
  typeof __API_BASE__ !== 'undefined' && __API_BASE__
    ? `${__API_BASE__}/api`
    : '/api'

// Base instance — no global timeout so large uploads never time out
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 0,
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

// ── Upload ────────────────────────────────────────────────────────────────────
/**
 * Upload a file of any size with real-time progress.
 * @param {File}     file        - The File object to upload
 * @param {Function} onProgress  - Called with (percent, speedMBps, etaSeconds)
 * @param {AbortSignal} signal   - Optional AbortController signal for cancellation
 */
export const uploadFile = (file, onProgress, signal) => {
  const form = new FormData()
  form.append('file', file)

  let startTime = Date.now()
  let lastLoaded = 0
  let lastTime = startTime

  return api.post('/upload/file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,   // no timeout for uploads
    signal,
    onUploadProgress: (e) => {
      if (!onProgress) return
      const now = Date.now()
      const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0

      // Speed calculation (MB/s) over the last interval
      const dtSec = (now - lastTime) / 1000
      const dBytes = e.loaded - lastLoaded
      const speedMBps = dtSec > 0 ? (dBytes / (1024 * 1024)) / dtSec : 0

      // ETA in seconds
      const remaining = e.total ? e.total - e.loaded : 0
      const etaSec = speedMBps > 0 ? remaining / (speedMBps * 1024 * 1024) : null

      lastLoaded = e.loaded
      lastTime = now

      onProgress(percent, Math.max(0, speedMBps), etaSec)
    },
  })
}

/**
 * Pre-flight check — validate extension before sending bytes.
 */
export const checkFileInfo = (filename) =>
  api.get('/upload/info', { params: { filename }, timeout: 5000 })

// ── Analysis ──────────────────────────────────────────────────────────────────
export const startAnalysis = (sessionId, reviewColumn, ratingColumn, maxRows = 5000) =>
  api.post('/analysis/run', {
    session_id: sessionId,
    review_column: reviewColumn,
    rating_column: ratingColumn,
    max_rows: maxRows,
  }, { timeout: 30000 })

export const getAnalysisStatus = (sessionId) =>
  api.get(`/analysis/status/${sessionId}`, { timeout: 10000 })

export const getAnalysisResults = (sessionId) =>
  api.get(`/analysis/results/${sessionId}`, { timeout: 60000 })

export const analyzeText = (text) =>
  api.post(`/analysis/analyze-text?text=${encodeURIComponent(text)}`, null, { timeout: 30000 })

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getChartData = (sessionId) =>
  api.get(`/dashboard/${sessionId}/charts`, { timeout: 60000 })

export const getReviews = (sessionId, page = 1, pageSize = 20, sentiment = null, search = null) => {
  const params = { page, page_size: pageSize }
  if (sentiment) params.sentiment = sentiment
  if (search) params.search = search
  return api.get(`/dashboard/${sessionId}/reviews`, { params, timeout: 30000 })
}

// ── Export ────────────────────────────────────────────────────────────────────
export const exportPDF = (sessionId) =>
  api.get(`/export/${sessionId}/pdf`, { responseType: 'blob', timeout: 120000 })

export const exportCSV = (sessionId) =>
  api.get(`/export/${sessionId}/csv`, { responseType: 'blob', timeout: 60000 })

export const exportJSON = (sessionId) =>
  api.get(`/export/${sessionId}/json`, { timeout: 60000 })

export default api
