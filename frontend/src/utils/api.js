import axios from 'axios'

// Always use a relative /api path.
// - In local dev: Vite proxy (vite.config.js) rewrites /api → http://localhost:8000/api
// - In production (Cloudflare Pages): _redirects proxies /api/* → Render backend
// This means NO hardcoded backend URL is ever baked into the JS bundle.
const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 0, // no global timeout — large uploads/analyses need unlimited time
})

api.interceptors.response.use(
  res => res,
  err => {
    // Provide a user-friendly message for common failure modes
    if (!err.response) {
      // Network error or CORS block — backend is likely unreachable
      return Promise.reject(
        new Error('Cannot reach the backend. Make sure the API server is running.')
      )
    }
    if (err.response.status === 404) {
      // On Cloudflare Pages this usually means the _redirects proxy target is unreachable
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        return Promise.reject(new Error(detail))
      }
      return Promise.reject(
        new Error(
          'API endpoint not found (404). ' +
          'If you are on the live site, verify the backend is deployed on Render ' +
          'and the _redirects proxy in Cloudflare Pages is pointing to the correct URL.'
        )
      )
    }
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

// ── Upload ────────────────────────────────────────────────────────────────────
/**
 * Upload a file of any size with real-time progress.
 * @param {File}      file       - The File object to upload
 * @param {Function}  onProgress - Called with (percent, speedMBps, etaSeconds)
 * @param {AbortSignal} signal   - Optional AbortController signal for cancellation
 */
export const uploadFile = (file, onProgress, signal) => {
  const form = new FormData()
  form.append('file', file)

  let lastLoaded = 0
  let lastTime = Date.now()

  return api.post('/upload/file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    signal,
    onUploadProgress: (e) => {
      if (!onProgress) return
      const now = Date.now()
      const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0

      const dtSec = (now - lastTime) / 1000
      const dBytes = e.loaded - lastLoaded
      const speedMBps = dtSec > 0 ? dBytes / (1024 * 1024) / dtSec : 0

      const remaining = e.total ? e.total - e.loaded : 0
      const etaSec = speedMBps > 0 ? remaining / (speedMBps * 1024 * 1024) : null

      lastLoaded = e.loaded
      lastTime = now

      onProgress(percent, Math.max(0, speedMBps), etaSec)
    },
  })
}

/** Pre-flight check — validate extension before sending bytes. */
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
