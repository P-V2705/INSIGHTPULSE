import React from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Zap, BarChart3, Shield, TrendingUp, MessageSquare,
  ArrowRight, CheckCircle, Sparkles, Database, FileText, Globe
} from 'lucide-react'

const FEATURES = [
  { icon: Brain,        title: 'Deep NLP Engine',       desc: 'Tokenization, lemmatization, stemming, stopword removal, and advanced text preprocessing.' },
  { icon: Zap,          title: 'Real-Time Sentiment',   desc: 'VADER + TextBlob ensemble for accurate positive, negative, and neutral classification.' },
  { icon: BarChart3,    title: 'Interactive Dashboards', desc: 'Dynamic charts, word clouds, trend lines, and emotion distribution visualizations.' },
  { icon: Shield,       title: 'Fake Review Detection', desc: 'Heuristic AI engine flags suspicious reviews with confidence scoring.' },
  { icon: TrendingUp,   title: 'Quality Prediction',    desc: 'AI predicts product/service quality: Excellent, Good, Average, Poor, or Bad.' },
  { icon: MessageSquare,'title': 'AI Summarizer',       desc: 'Extractive NLP summarization condenses thousands of reviews into key insights.' },
]

const CATEGORIES = [
  'Products', 'Movies', 'Perfumes', 'Grocery', 'Restaurants',
  'Mobile Phones', 'Gadgets', 'Hotels', 'Apps', 'Services'
]

const STATS = [
  { value: '10+',  label: 'Review Categories' },
  { value: '5',    label: 'NLP Techniques' },
  { value: '99%',  label: 'Accuracy Rate' },
  { value: '2000+', label: 'Reviews / Batch' },
]

export default function HomePage() {
  return (
    <div className="animate-fade-in">

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
            <Sparkles size={12} />
            InsightPulse — AI-Powered NLP Intelligence Platform
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-100 leading-tight tracking-tight mb-6">
            Understand What Your
            <span className="block bg-gradient-to-r from-brand-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Customers Really Feel
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Import Kaggle datasets, run advanced NLP analysis, detect sentiments, predict quality,
            and generate professional AI-driven insights — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/upload" className="btn-primary text-base px-7 py-3">
              Start Analysis <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base px-7 py-3">
              View Demo Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-brand-400 mb-1">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-100 mb-3">Enterprise-Grade NLP Capabilities</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every feature is built for production-scale review intelligence, not toy demos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover p-6 group">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <Icon size={20} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Categories */}
      <section className="py-16 px-4 bg-slate-900/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-100 mb-3">Supports All Review Categories</h2>
          <p className="text-slate-400 mb-8 text-sm">Works with any Kaggle review dataset across industries.</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map(cat => (
              <span key={cat} className="px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:border-brand-500/40 hover:text-brand-300 transition-colors cursor-default">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-100 mb-3">How It Works</h2>
            <p className="text-slate-400">Four steps from raw data to actionable intelligence.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: '01', icon: Database,   title: 'Import Dataset',    desc: 'Upload CSV, Excel, or JSON from Kaggle or any source.' },
              { step: '02', icon: Brain,       title: 'NLP Processing',    desc: 'Tokenize, clean, lemmatize, and extract features.' },
              { step: '03', icon: TrendingUp,  title: 'Sentiment Analysis', desc: 'Classify reviews and predict quality scores.' },
              { step: '04', icon: BarChart3,   title: 'Visual Dashboard',  desc: 'Explore interactive charts and export reports.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="card p-6 relative">
                <div className="text-5xl font-black text-slate-800 absolute top-4 right-4 leading-none select-none">{step}</div>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center card p-12 glow-brand">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/30">
            <Brain size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to Analyze Your Reviews?</h2>
          <p className="text-slate-400 mb-8">Upload your dataset and get AI-powered insights in minutes with InsightPulse.</p>
          <Link to="/upload" className="btn-primary text-base px-8 py-3">
            Upload Dataset <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 px-4 text-center">
        <p className="text-slate-500 text-sm">
          INSIGHT PULSE — Advanced NLP Intelligence System &nbsp;·&nbsp; Built with FastAPI + React + Tailwind
        </p>
      </footer>
    </div>
  )
}
