import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  BarChart3, Download, FileText, AlertCircle, Loader2,
  TrendingUp, MessageSquare, Shield, Star, Search,
  ChevronLeft, ChevronRight, RefreshCw, Sparkles, Brain,
  CheckCircle, ArrowRight, TriangleAlert, Upload, RotateCcw,
  Code2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getChartData, getReviews, exportPDF, exportCSV, exportJSON } from '../utils/api'
import { useApp } from '../context/AppContext'
import clsx from 'clsx'

const SENTIMENT_COLORS = { Positive: '#10b981', Negative: '#ef4444', Neutral: '#f59e0b' }
const EMOTION_COLORS = ['#f59e0b','#ef4444','#6366f1','#8b5cf6','#06b6d4','#10b981','#f97316','#ec4899']

function StatCard({ label, value, sub, color = 'brand', icon: Icon }) {
  const colorMap = {
    brand:   'text-brand-400 bg-brand-500/10 border-brand-500/20',
    green:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red:     'text-red-400 bg-red-500/10 border-red-500/20',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
    violet:  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  }
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={17} />
      </div>
      <div className="text-2xl font-bold text-slate-100 mt-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </div>
  )
}

function QualityBadge({ quality }) {
  const map = {
    Excellent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Good:      'bg-blue-500/15 text-blue-300 border-blue-500/30',
    Average:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Poor:      'bg-orange-500/15 text-orange-300 border-orange-500/30',
    Bad:       'bg-red-500/15 text-red-300 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${map[quality] || map.Average}`}>
      {quality}
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { sessionId, analysisResults, resetSession } = useApp()
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewMeta, setReviewMeta] = useState({ total: 0, page: 1, total_pages: 1 })
  const [sentimentFilter, setSentimentFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    if (sessionId) {
      loadCharts()
      loadReviews(1)
    }
  }, [sessionId])

  const loadCharts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getChartData(sessionId)
      setCharts(res.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async (page = 1) => {
    if (!sessionId) return
    try {
      const res = await getReviews(sessionId, page, 15, sentimentFilter || null, searchQuery || null)
      setReviews(res.data.reviews)
      setReviewMeta({ total: res.data.total, page: res.data.page, total_pages: res.data.total_pages })
    } catch (e) {
      // silent
    }
  }

  useEffect(() => {
    if (sessionId) loadReviews(1)
  }, [sentimentFilter, searchQuery])

  const handleNewAnalysis = () => {
    resetSession()
    navigate('/upload')
    toast('Ready for a new dataset', { icon: '🔄' })
  }

  const handleExportPDF = async () => {
    setExporting('pdf')
    try {
      const res = await exportPDF(sessionId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = 'sentiment_report.pdf'; a.click()
      toast.success('PDF downloaded!')
    } catch (e) { toast.error(e.message) }
    finally { setExporting('') }
  }

  const handleExportJSON = async () => {
    setExporting('json')
    try {
      const res = await exportJSON(sessionId)
      const url = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = 'sentiment_analysis.json'; a.click()
      toast.success('JSON downloaded!')
    } catch (e) { toast.error(e.message) }
    finally { setExporting('') }
  }

  const handleExportCSV = async () => {
    setExporting('csv')
    try {
      const res = await exportCSV(sessionId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a'); a.href = url; a.download = 'sentiment_results.csv'; a.click()
      toast.success('CSV downloaded!')
    } catch (e) { toast.error(e.message) }
    finally { setExporting('') }
  }

  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-5">
          <BarChart3 size={28} className="text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-300 mb-3">No Analysis Data</h2>
        <p className="text-slate-500 mb-6">Upload a dataset and run analysis to see your dashboard.</p>
        <button onClick={() => navigate('/upload')} className="btn-primary">Upload Dataset</button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="text-brand-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
        <p className="text-red-300 mb-4">{error}</p>
        <button onClick={() => navigate('/analysis')} className="btn-primary">Run Analysis First</button>
      </div>
    )
  }

  if (!charts) return null

  const overview = charts.sentiment_overview || {}
  const quality = charts.quality_prediction || {}
  const sentPie = charts.sentiment_pie || {}
  const emoBar = charts.emotion_bar || {}
  const trendChart = charts.trend_chart || {}
  const ratingChart = charts.rating_chart || {}
  const wordCloud = charts.word_cloud || []
  const topics = charts.topics || []
  const categoryChart = charts.category_chart || {}

  // Prepare chart data
  const pieData = (sentPie.labels || []).map((l, i) => ({
    name: l, value: sentPie.values?.[i] || 0, pct: sentPie.percentages?.[i] || 0
  }))

  const emoData = (emoBar.labels || []).map((l, i) => ({
    name: l.charAt(0).toUpperCase() + l.slice(1),
    value: parseFloat(emoBar.values?.[i] || 0)
  }))

  const trendData = (trendChart.labels || []).map((l, i) => ({
    index: l,
    score: trendChart.sentiment_scores?.[i] || 0,
    positive: trendChart.positive?.[i] || 0,
    negative: trendChart.negative?.[i] || 0,
    neutral: trendChart.neutral?.[i] || 0,
  }))

  const ratingData = (ratingChart.labels || []).map((l, i) => ({
    rating: `${l}★`, count: ratingChart.values?.[i] || 0
  }))

  const categoryData = (categoryChart.labels || []).map((l, i) => ({
    name: l,
    sentiment: parseFloat(categoryChart.avg_sentiments?.[i] || 0).toFixed(3),
    count: categoryChart.counts?.[i] || 0,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-fade-in space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">InsightPulse Dashboard</h1>
          <p className="text-slate-400 text-sm">AI-powered sentiment intelligence · {overview.total_analyzed?.toLocaleString()} reviews analyzed</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNewAnalysis} className="btn-ghost text-sm">
            <RotateCcw size={15} /> New Analysis
          </button>
          <button onClick={loadCharts} className="btn-ghost text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={handleExportCSV} disabled={exporting === 'csv'} className="btn-secondary text-sm">
            {exporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            CSV
          </button>
          <button onClick={handleExportJSON} disabled={exporting === 'json'} className="btn-secondary text-sm">
            {exporting === 'json' ? <Loader2 size={14} className="animate-spin" /> : <Code2 size={14} />}
            JSON
          </button>
          <button onClick={handleExportPDF} disabled={exporting === 'pdf'} className="btn-primary text-sm">
            {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            PDF Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={MessageSquare} label="Total Reviews"   value={overview.total_analyzed?.toLocaleString() || '—'} color="brand" />
        <StatCard icon={TrendingUp}    label="Positive"        value={`${overview.positive_pct}%`} sub={`${overview.positive_count} reviews`} color="green" />
        <StatCard icon={AlertCircle}   label="Negative"        value={`${overview.negative_pct}%`} sub={`${overview.negative_count} reviews`} color="red" />
        <StatCard icon={BarChart3}     label="Neutral"         value={`${overview.neutral_pct}%`}  sub={`${overview.neutral_count} reviews`}  color="amber" />
        <StatCard icon={Star}          label="Trust Score"     value={`${quality.trust_score}%`}   color="violet" />
        <StatCard icon={Shield}        label="Suspicious"      value={`${overview.fake_review_pct}%`} sub={`${overview.fake_review_count} flagged`} color="red" />
      </div>

      {/* Quality Prediction Banner */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/25">
          <Brain size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-medium text-slate-400">AI Quality Prediction</span>
            <QualityBadge quality={quality.quality} />
          </div>
          <p className="text-slate-300 text-sm">{quality.recommendation}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-brand-400">{quality.trust_score}%</div>
          <div className="text-xs text-slate-500">Trust Score</div>
        </div>
      </div>

      {/* Concise AI Consultation Summary */}
      {charts.ai_summary && (() => {
        const s = charts.ai_summary
        // Support both old string format and new structured dict
        if (typeof s === 'string') {
          return (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-brand-400" />
                <span className="font-semibold text-slate-200 text-sm">AI Summary</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{s}</p>
            </div>
          )
        }
        return (
          <div className="card p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-brand-400" />
              <span className="font-semibold text-slate-200 text-sm">AI Consultation</span>
            </div>

            {/* Three insight rows */}
            <div className="space-y-3">
              {/* Headline */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain size={12} className="text-brand-400" />
                </div>
                <p className="text-slate-200 text-sm font-medium leading-snug">{s.headline}</p>
              </div>

              {/* Insight */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp size={12} className="text-violet-400" />
                </div>
                <p className="text-slate-400 text-sm leading-snug">{s.insight}</p>
              </div>

              {/* Action */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRight size={12} className="text-emerald-400" />
                </div>
                <p className="text-slate-400 text-sm leading-snug">{s.action}</p>
              </div>
            </div>

            {/* Flags — only shown when present */}
            {s.flags?.length > 0 && (
              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                {s.flags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <TriangleAlert size={11} className="text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300">{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Charts Row 1: Sentiment Pie + Emotion Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="section-title mb-1">Sentiment Distribution</h3>
          <p className="section-subtitle mb-5">Overall positive / negative / neutral breakdown</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
                dataKey="value" paddingAngle={3} label={({ name, pct }) => `${name} ${pct}%`}
                labelLine={false}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={sentPie.colors?.[i] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="section-title mb-1">Emotion Distribution</h3>
          <p className="section-subtitle mb-5">Detected emotional tones across all reviews</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={emoData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {emoData.map((_, i) => <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title mb-1">Sentiment Trend</h3>
          <p className="section-subtitle mb-5">Average sentiment score across review batches</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10 }} />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} name="Avg Sentiment" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rating Distribution + Word Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ratingData.length > 0 && (
          <div className="card p-6">
            <h3 className="section-title mb-1">Rating Distribution</h3>
            <p className="section-subtitle mb-5">How customers rated the product/service</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="rating" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Keywords */}
        <div className="card p-6">
          <h3 className="section-title mb-1">Top Keywords</h3>
          <p className="section-subtitle mb-5">Most frequent meaningful terms in reviews</p>
          <div className="flex flex-wrap gap-2">
            {wordCloud.slice(0, 25).map((w, i) => {
              const size = Math.max(11, Math.min(20, 11 + (w.value / (wordCloud[0]?.value || 1)) * 9))
              const opacity = 0.5 + (w.value / (wordCloud[0]?.value || 1)) * 0.5
              return (
                <span key={i} style={{ fontSize: size, opacity }}
                  className="px-2.5 py-1 bg-brand-500/10 text-brand-300 rounded-lg border border-brand-500/15 font-medium cursor-default hover:bg-brand-500/20 transition-colors">
                  {w.text}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title mb-1">Category Breakdown</h3>
          <p className="section-subtitle mb-5">Average sentiment score per product / service category</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10 }}
                formatter={(v, n, p) => [v, 'Avg Sentiment']}
                labelFormatter={(l) => `${l} (${categoryData.find(d => d.name === l)?.count || 0} reviews)`}
              />
              <Bar dataKey="sentiment" radius={[4, 4, 0, 0]} name="Avg Sentiment">
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={parseFloat(entry.sentiment) >= 0.05 ? '#10b981' : parseFloat(entry.sentiment) <= -0.05 ? '#ef4444' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Topics */}
      {topics.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title mb-1">Discovered Topics</h3>
          <p className="section-subtitle mb-5">AI-extracted topic clusters from review content</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topics.map(t => (
              <div key={t.topic} className="bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs font-semibold text-brand-400 mb-2">Topic {t.topic}</div>
                <div className="flex flex-wrap gap-1">
                  {t.keywords.map(kw => (
                    <span key={kw} className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md">{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="section-title">Review Intelligence Table</h3>
            <p className="section-subtitle">{reviewMeta.total} reviews · Page {reviewMeta.page} of {reviewMeta.total_pages}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reviews..."
                className="input-field pl-8 py-2 text-sm w-48"
              />
            </div>
            <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)} className="input-field py-2 text-sm w-36">
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Neutral">Neutral</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs">#</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs">Review</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs">Sentiment</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs">Score</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs">Confidence</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs">Emotion</th>
                <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs">Authentic</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-600 text-xs">{r.index + 1}</td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs">
                    <span className="line-clamp-2 text-xs leading-relaxed">{r.review_snippet}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={clsx('badge', {
                      'badge-positive': r.sentiment === 'Positive',
                      'badge-negative': r.sentiment === 'Negative',
                      'badge-neutral':  r.sentiment === 'Neutral',
                    })}>
                      {r.sentiment}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-xs font-mono">{r.compound_score?.toFixed(3)}</td>
                  <td className="py-3 px-3 text-slate-300 text-xs">{r.confidence}%</td>
                  <td className="py-3 px-3 text-slate-400 text-xs capitalize">{r.dominant_emotion}</td>
                  <td className="py-3 px-3">
                    <span className={clsx('text-xs font-medium', r.is_suspicious ? 'text-red-400' : 'text-emerald-400')}>
                      {r.is_suspicious ? '⚠ Suspicious' : '✓ Authentic'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">{reviewMeta.total} total reviews</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => loadReviews(reviewMeta.page - 1)}
              disabled={reviewMeta.page <= 1}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-slate-400 px-2">Page {reviewMeta.page} / {reviewMeta.total_pages}</span>
            <button
              onClick={() => loadReviews(reviewMeta.page + 1)}
              disabled={reviewMeta.page >= reviewMeta.total_pages}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
