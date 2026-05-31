import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Brain, Sun, Moon, BarChart3, Upload, Home, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'
import clsx from 'clsx'

const NAV_LINKS = [
  { to: '/',          label: 'Home',      icon: Home },
  { to: '/upload',    label: 'Upload',    icon: Upload },
  { to: '/analysis',  label: 'Analysis',  icon: Activity },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
]

export default function Navbar() {
  const { theme, toggleTheme } = useApp()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:shadow-brand-500/40 transition-shadow">
              <Brain className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-slate-100 tracking-tight">SentimentAI</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Platform</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === to
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link to="/upload" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
