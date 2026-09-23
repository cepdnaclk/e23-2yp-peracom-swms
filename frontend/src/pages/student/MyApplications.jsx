import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  AlertCircle,
  Eye,
  Download,
  X,
  User,
  DollarSign,
  Users,
  GraduationCap,
  CreditCard,
  Clock,
  CheckCircle,
  Search,
  ChevronDown,
  CalendarDays,
  ArrowUpDown,
  BookOpen,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { StatusBadge } from '../../components/common/StatusBadge'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns'


const TABS = [
  'All',
  'Pending',
  'Under Admin Review',
  'Awaiting Payment Details',
  'Payment Details Submitted',
  'Payment Correction Required',
  'Payment Details Verified',
  'Assigned to Donor',
  'Payment Processing',
  'Completed',
  'Rejected',
  'Resubmission Requested',
]

const REQUIRED_DOCS = [
  'NIC Copy',
  'Academic Transcript',
  'Faculty Acceptance Letter',
  'Student Request Letter',
  'University ID Copy',
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Amount: High to Low' },
  { value: 'amount_asc', label: 'Amount: Low to High' },
]

// ── Status helpers
const STATUS_COLORS = {
  'Pending':                    { border: 'border-l-amber-400',  bg: 'bg-amber-50/40',   dot: 'bg-amber-400',   pulse: true  },
  'Under Admin Review':         { border: 'border-l-blue-400',   bg: 'bg-blue-50/30',    dot: 'bg-blue-500',    pulse: true  },
  'Resubmission Requested':     { border: 'border-l-orange-400', bg: 'bg-orange-50/30',  dot: 'bg-orange-400',  pulse: true  },
  'Awaiting Payment Details':   { border: 'border-l-purple-400', bg: 'bg-purple-50/30',  dot: 'bg-purple-500',  pulse: true  },
  'Payment Details Submitted':  { border: 'border-l-blue-500',   bg: 'bg-blue-50/30',    dot: 'bg-blue-500',    pulse: true  },
  'Payment Correction Required':{ border: 'border-l-red-400',    bg: 'bg-red-50/30',     dot: 'bg-red-500',     pulse: true  },
  'Payment Details Verified':   { border: 'border-l-green-400',  bg: 'bg-green-50/30',   dot: 'bg-green-500',   pulse: false },
  'Assigned to Donor':          { border: 'border-l-indigo-500', bg: 'bg-indigo-50/30',  dot: 'bg-indigo-500',  pulse: true  },
  'Payment Processing':         { border: 'border-l-blue-600',   bg: 'bg-blue-50/30',    dot: 'bg-blue-600',    pulse: true  },
  'Completed':                  { border: 'border-l-green-500',  bg: 'bg-green-50/20',   dot: 'bg-green-600',   pulse: false },
  'Rejected':                   { border: 'border-l-red-500',    bg: 'bg-red-50/20',     dot: 'bg-red-500',     pulse: false },
}

// ── Step Tracker
const STEPS = [
  { key: 'applied',    label: 'Applied',        statuses: ['Pending'] },
  { key: 'review',     label: 'Admin Review',   statuses: ['Under Admin Review', 'Resubmission Requested'] },
  { key: 'payment',    label: 'Payment Setup',  statuses: ['Awaiting Payment Details', 'Payment Details Submitted', 'Payment Correction Required', 'Payment Details Verified'] },
  { key: 'assigned',   label: 'Assigned',       statuses: ['Assigned to Donor', 'Payment Processing'] },
  { key: 'completed',  label: 'Completed',      statuses: ['Completed', 'Rejected'] },
]

function getStepIndex(status) {
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].statuses.includes(status)) return i
  }
  return 0
}

function StepTracker({ status }) {
  const currentIndex = getStepIndex(status)
  const isRejected   = status === 'Rejected'
  const isCompleted  = status === 'Completed'

  return (
    <div className="mt-4 px-1">
      <div className="flex items-center justify-between relative">
        {/* connector line */}
        <div className="absolute top-3 left-0 right-0 h-px bg-slate-200 z-0" />
        <div
          className={`absolute top-3 left-0 h-px z-0 transition-all duration-700 ${
            isRejected ? 'bg-red-400' : 'bg-gradient-to-r from-purple-500 to-purple-300'
          }`}
          style={{ width: currentIndex === 0 ? '0%' : `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone    = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isFuture  = idx > currentIndex
          const isLastRejected = isRejected && idx === currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center z-10 gap-1" style={{ flex: 1 }}>
              {/* dot */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                  isLastRejected
                    ? 'bg-red-500 text-white ring-2 ring-red-200'
                    : isDone
                    ? 'bg-purple-600 text-white'
                    : isCurrent
                    ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isLastRejected ? '✕' : isDone ? '✓' : idx + 1}
              </div>
              {/* label */}
              <span
                className={`text-[9px] font-semibold text-center leading-tight transition-colors ${
                  isLastRejected
                    ? 'text-red-500'
                    : isCurrent
                    ? 'text-purple-700'
                    : isDone
                    ? 'text-slate-600'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function MyApplications() {
  const [apps, setApps]             = useState([])
  const [tab, setTab]               = useState('All')
  const [loading, setLoading]       = useState(true)
  const [selectedApp, setSelectedApp] = useState(null)
  const [search, setSearch]         = useState('')
  const [sortBy, setSortBy]         = useState('newest')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const tabsRef = useRef(null)

  const loadApps = () => {
    setLoading(true)
    api
      .get('/student/applications')
      .then(response => {
        setApps(Array.isArray(response.data) ? response.data : [])
      })
      .catch(error => {
        console.error('Load student applications error:', error)
        toast.error(error?.response?.data?.message || 'Failed to load applications')
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadApps() }, [])

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? apps.length : apps.filter(a => a.status === t).length
    return acc
  }, {})

  // ── Apply all filters
  const filtered = (() => {
    let result = tab === 'All' ? apps : apps.filter(a => a.status === tab)

    // search
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(a =>
        a.scholarship_title?.toLowerCase().includes(q)
      )
    }

    // date range
    if (dateFrom) {
      const from = parseISO(dateFrom)
      result = result.filter(a => a.created_at && !isBefore(new Date(a.created_at), from))
    }
    if (dateTo) {
      const to = parseISO(dateTo)
      result = result.filter(a => a.created_at && !isAfter(new Date(a.created_at), to))
    }

    // sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'amount_desc') return (Number(b.funding_amount) || 0) - (Number(a.funding_amount) || 0)
      if (sortBy === 'amount_asc')  return (Number(a.funding_amount) || 0) - (Number(b.funding_amount) || 0)
      return 0
    })

    return result
  })()

  const hasActiveFilters = search || dateFrom || dateTo || sortBy !== 'newest'

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track every step of your scholarship journey.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Summary pill */}
          {!loading && (
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
              <span className="font-semibold text-slate-700">{apps.length} Total</span>
              {apps.filter(a => ['Pending','Under Admin Review','Resubmission Requested'].includes(a.status)).length > 0 && (
                <span className="text-amber-600 font-semibold">
                  {apps.filter(a => ['Pending','Under Admin Review','Resubmission Requested'].includes(a.status)).length} Active
                </span>
              )}
              {apps.filter(a => a.status === 'Completed').length > 0 && (
                <span className="text-green-600 font-semibold">
                  {apps.filter(a => a.status === 'Completed').length} Completed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {/* Search input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by scholarship name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pl-8 pr-7 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none cursor-pointer text-slate-700 font-medium"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date range toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showFilters || dateFrom || dateTo
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
            }`}
          >
            <CalendarDays size={14} />
            <span className="hidden sm:inline">Date Range</span>
            {(dateFrom || dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setSortBy('newest'); setDateFrom(''); setDateTo(''); }}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Date range inputs */}
        {showFilters && (
          <div className="flex gap-3 flex-wrap p-3 bg-purple-50/60 border border-purple-100 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Tabs — desktop: scrollable pills, mobile: dropdown */}
      <div>
        {/* Mobile dropdown */}
        <div className="block md:hidden relative">
          <select
            value={tab}
            onChange={e => setTab(e.target.value)}
            className="w-full pl-4 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none"
          >
            {TABS.map(t => (
              <option key={t} value={t}>{t}{counts[t] > 0 ? ` (${counts[t]})` : ''}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Desktop scrollable pills */}
        <div
          ref={tabsRef}
          className="hidden md:flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300 hover:text-purple-600'
              }`}
            >
              {t}
              {counts[t] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab === t ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && apps.length > 0 && (
        <p className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-600">{filtered.length}</span> of{' '}
          <span className="font-semibold text-slate-600">{apps.length}</span> application{apps.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Content */}
      {loading ? (
        /* Skeleton loader */
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between gap-4">
                    <div className="h-4 bg-slate-100 rounded w-48" />
                    <div className="h-4 bg-slate-100 rounded w-20" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-32" />
                  <div className="h-2 bg-slate-100 rounded w-full mt-6" />
                  <div className="flex gap-6 pt-1">
                    {[1,2,3,4,5].map(j => <div key={j} className="h-5 bg-slate-100 rounded-full flex-1" />)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Enhanced Empty State */
        <div className="card p-12 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
            <BookOpen size={36} className="text-purple-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-700">
              {search || dateFrom || dateTo || tab !== 'All'
                ? 'No matching applications'
                : 'No applications yet'}
            </h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              {search || dateFrom || dateTo || tab !== 'All'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Apply for your first scholarship today and take a step towards your academic goals!'}
            </p>
          </div>
          {tab === 'All' && !search && !dateFrom && !dateTo ? (
            <Link
              to="/student/scholarships"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-purple-200"
            >
              <Sparkles size={15} />
              Browse Scholarships
            </Link>
          ) : (
            <button
              onClick={() => { setSearch(''); setSortBy('newest'); setDateFrom(''); setDateTo(''); setTab('All'); }}
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const statusStyle = STATUS_COLORS[app.status] || { border: 'border-l-slate-300', bg: '', dot: 'bg-slate-400', pulse: false }
            const appliedDate = app.created_at ? new Date(app.created_at) : null
            const timeAgo = appliedDate ? formatDistanceToNow(appliedDate, { addSuffix: true }) : null

            return (
              <div
                key={app.id}
                className={`card hover:shadow-md transition-all border-l-4 ${statusStyle.border} ${statusStyle.bg}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon with status dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                        <FileText size={18} className="text-purple-600" />
                      </div>
                      {/* Animated status pulse dot */}
                      <span
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusStyle.dot}`}
                      >
                        {statusStyle.pulse && (
                          <span
                            className={`absolute inset-0 rounded-full ${statusStyle.dot} opacity-75 animate-ping`}
                          />
                        )}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 leading-snug">{app.scholarship_title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {/* Days since applied */}
                            <span className="text-xs text-slate-400">
                              Applied <span className="font-medium text-slate-500">{timeAgo}</span>
                              {appliedDate && (
                                <span className="text-slate-300"> · {format(appliedDate, 'MMM d, yyyy')}</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          {app.funding_amount && (
                            <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                              LKR {Number(app.funding_amount).toLocaleString()}
                            </span>
                          )}
                          <StatusBadge status={app.status} />
                        </div>
                      </div>

                      {/* Admin note */}
                      {app.admin_reason && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 flex items-start gap-1.5">
                          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                          <span><span className="font-semibold">Admin note:</span> {app.admin_reason}</span>
                        </div>
                      )}

                      {/* Student workflow actions */}
                      {app.status === 'Resubmission Requested' && (
                        <Link
                          to={`/student/scholarships/${app.scholarship_id}`}
                          className="mt-3 flex items-center justify-between gap-2 bg-orange-50 border border-orange-300 rounded-xl px-4 py-3 text-orange-700 text-xs font-semibold hover:bg-orange-100 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <RotateCcw size={13} />
                            Admin requested changes. Review the note above and resubmit your application.
                          </span>
                          <span className="underline whitespace-nowrap flex-shrink-0">Resubmit Application →</span>
                        </Link>
                      )}
                      {app.status === 'Awaiting Payment Details' && (
                        <Link
                          to={`/student/payment/${app.id}`}
                          className="mt-3 flex items-center justify-between gap-2 bg-gradient-to-r from-purple-700 to-purple-500 rounded-xl px-4 py-3 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          <span>Your application passed the admin review. Submit your bank details.</span>
                          <span className="underline whitespace-nowrap flex-shrink-0">Submit Details →</span>
                        </Link>
                      )}
                      {app.status === 'Payment Correction Required' && (
                        <Link
                          to={`/student/payment/${app.id}`}
                          className="mt-3 flex items-center justify-between gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <span>Your payment details require correction. Review the admin instructions and resubmit.</span>
                          <span className="underline whitespace-nowrap flex-shrink-0">Correct Details →</span>
                        </Link>
                      )}
                      {app.status === 'Payment Details Submitted' && (
                        <Link
                          to={`/student/payment/${app.id}`}
                          className="mt-3 flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <span>Payment details submitted and waiting for admin verification.</span>
                          <span className="underline whitespace-nowrap flex-shrink-0">View →</span>
                        </Link>
                      )}
                      {app.status === 'Payment Details Verified' && (
                        <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-xs font-semibold">
                          <CheckCircle size={14} />
                          Payment details verified. Waiting for donor assignment.
                        </div>
                      )}
                      {app.status === 'Assigned to Donor' && (
                        <div className="mt-3 flex items-center justify-between gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 text-purple-700 text-xs font-semibold">
                          <span>Your application has been assigned to the scholarship donor.</span>
                          <span>Payment pending</span>
                        </div>
                      )}
                      {app.status === 'Payment Processing' && (
                        <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-blue-700 text-xs font-semibold">
                          <Clock size={14} />
                          Your scholarship payment is being processed.
                        </div>
                      )}
                      {app.status === 'Completed' && (
                        <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-green-700 text-xs font-semibold">
                          <CheckCircle size={14} />
                          Scholarship payment completed successfully.
                        </div>
                      )}

                      {/* ── Step Tracker (replaces old progress bar) */}
                      <StepTracker status={app.status} />

                      {/* Footer actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          <Eye size={14} />
                          View Application
                        </button>
                        <span className="text-[10px] text-slate-300 font-mono">#{app.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  )
}

// ── Application Detail Modal (Read-only for Student)
function ApplicationDetailModal({ app, onClose }) {
  const [docs, setDocs] = useState([])
  const [payment, setPayment] = useState(null)
  const [scholarshipPayment, setScholarshipPayment] =
    useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!app) return

    setLoading(true)

    Promise.all([
      api
        .get(`/applications/${app.id}/documents`)
        .catch(() => ({ data: [] })),

      api
        .get(`/payment/${app.id}`)
        .catch(() => ({ data: null })),

      api
        .get(
          `/student/applications/${app.id}/payment-progress`
        )
        .catch(() => ({ data: null })),
    ])
      .then(
        ([
          documentsResponse,
          paymentDetailsResponse,
          scholarshipPaymentResponse,
        ]) => {
          setDocs(
            Array.isArray(documentsResponse.data)
              ? documentsResponse.data
              : []
          )

          setPayment(
            paymentDetailsResponse.data || null
          )

          setScholarshipPayment(
            scholarshipPaymentResponse.data || null
          )
        }
      )
      .catch(error => {
        console.error(
          'Load application details error:',
          error
        )
      })
      .finally(() => setLoading(false))
  }, [app])

  if (!app) return null

  const extra = (() => {
    try {
      return app.extra_data ? JSON.parse(app.extra_data) : {}
    } catch {
      return {}
    }
  })()

  const parseNum = (val) => val ? Number(val).toLocaleString() : '—'

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Application Details</h2>
            <p className="text-xs text-purple-600 font-medium mt-0.5">{app.scholarship_title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading application details...</span>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {/* Status Summary Widget */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatusCard
    label="Application Status"
    value={app.status}
    type="status"
  />

  <StatusCard
    label="Admin Review"
    value={
      app.status === 'Rejected'
        ? 'Rejected'
        : [
            'Awaiting Payment Details',
            'Payment Details Submitted',
            'Payment Correction Required',
            'Payment Details Verified',
            'Assigned to Donor',
            'Payment Processing',
            'Completed',
          ].includes(app.status)
        ? 'Approved'
        : 'Pending'
    }
  />

  <StatusCard
    label="Bank Details"
    value={
      payment?.payment_details_status ||
      'Locked'
    }
  />

  <StatusCard
    label="Scholarship Payment"
    value={
      scholarshipPayment?.payment_status ||
      (
        app.status === 'Completed'
          ? 'Paid'
          : app.status === 'Payment Processing'
          ? 'Processing'
          : app.status === 'Assigned to Donor'
          ? 'Pending'
          : 'Not Started'
      )
    }
  />
</div>

            {/* admin note if any */}
            {app.admin_reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Administrator Note:</span> {app.admin_reason}
                </div>
              </div>
            )}

            {/* Sections */}
            <div className="space-y-4">
              {/* Personal Information */}
              <DetailSection title="Personal Information" icon={User}>
                <InfoGrid>
                  <InfoItem label="Full Name" value={app.student_name} />
                  <InfoItem label="Registration Number" value={app.registration_number} mono />
                  <InfoItem label="NIC Number" value={extra.nic_number} mono />
                  <InfoItem label="Mobile Number" value={app.phone} />
                  <InfoItem label="Email Address" value={app.email} />
                  <InfoItem label="Batch" value={app.batch} />
                  <InfoItem label="District" value={extra.district} />
                  <InfoItem label="Department" value={app.department} />
                  <InfoItem label="Postal Address" value={extra.postal_address} fullWidth />
                </InfoGrid>
              </DetailSection>

              {/* Family Details */}
              <DetailSection title="Family Details" icon={Users}>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">School-going Sibling(s)</h4>
                    {extra.school_siblings?.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Date of Birth</th>
                              <th className="px-3 py-2">School</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {extra.school_siblings.map((s, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                                <td className="px-3 py-2">{s.dob ? format(new Date(s.dob), 'MMM d, yyyy') : '—'}</td>
                                <td className="px-3 py-2">{s.school}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No school-going siblings listed.</p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">University / Higher Education Sibling(s)</h4>
                    {extra.uni_siblings?.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">University / Institute</th>
                              <th className="px-3 py-2">Course</th>
                              <th className="px-3 py-2">A/L Year</th>
                              <th className="px-3 py-2">Mahapola</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {extra.uni_siblings.map((s, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                                <td className="px-3 py-2">{s.university}</td>
                                <td className="px-3 py-2">{s.course}</td>
                                <td className="px-3 py-2">{s.al_year}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.mahapola === 'Yes' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{s.mahapola || 'No'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No university siblings listed.</p>
                    )}
                  </div>
                </div>
              </DetailSection>

              {/* Financial Details */}
              <DetailSection title="Financial Details" icon={DollarSign}>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Father / Guardian</h4>
                      <InfoGrid>
                        <InfoItem label="Name" value={extra.father_name} />
                        <InfoItem label="Occupation" value={extra.father_occupation} />
                        <InfoItem label="Monthly Income" value={extra.father_income ? `LKR ${Number(extra.father_income).toLocaleString()}` : '—'} />
                        <InfoItem label="Employer" value={extra.father_employer} />
                        <InfoItem label="Contact" value={extra.father_contact} />
                      </InfoGrid>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mother / Guardian</h4>
                      <InfoGrid>
                        <InfoItem label="Name" value={extra.mother_name} />
                        <InfoItem label="Occupation" value={extra.mother_occupation} />
                        <InfoItem label="Monthly Income" value={extra.mother_income ? `LKR ${Number(extra.mother_income).toLocaleString()}` : '—'} />
                        <InfoItem label="Employer" value={extra.mother_employer} />
                        <InfoItem label="Contact" value={extra.mother_contact} />
                      </InfoGrid>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Income & Support Summary</h4>
                    <InfoGrid>
                      <InfoItem label="Total Monthly Family Income" value={`LKR ${parseNum(app.monthly_income)}`} />
                      <InfoItem label="Family Members Count" value={extra.num_family_members} />
                      <InfoItem label="Number of Dependents" value={app.num_dependents} />
                      <InfoItem label="School Children Count" value={extra.school_children_count} />
                      <InfoItem label="University Students Count" value={extra.uni_students_count} />
                      <InfoItem label="Receiving Mahapola" value={extra.receiving_mahapola || '—'} />
                      <InfoItem label="Receiving Bursary" value={extra.receiving_bursary || '—'} />
                      <InfoItem label="Other Scholarships" value={extra.other_scholarships || '—'} />
                      <InfoItem label="Total Other Scholarship Amount" value={extra.other_scholarship_amount ? `LKR ${Number(extra.other_scholarship_amount).toLocaleString()}` : '—'} />
                    </InfoGrid>
                  </div>
                </div>
              </DetailSection>

              {/* Academic Details */}
              <DetailSection title="Academic Details" icon={GraduationCap}>
                <InfoGrid>
                  <InfoItem label="Current Year of Study" value={app.current_year} />
                  <InfoItem label="Semester" value={extra.semester} />
                  <InfoItem label="GPA / CGPA" value={app.gpa ? parseFloat(app.gpa).toFixed(2) : '—'} />
                </InfoGrid>
              </DetailSection>

              {/* Uploaded Documents */}
              <DetailSection title="Uploaded Documents" icon={FileText}>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                        <th className="px-4 py-3">Document Name</th>
                        <th className="px-4 py-3">Uploaded File</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {REQUIRED_DOCS.map(name => {
                        const doc = docs.find(d => d.document_name === name)
                        return (
                          <tr key={name} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{name}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{doc ? doc.file_name : '—'}</td>
                            <td className="px-4 py-3">
                              {doc ? <StatusBadge status={doc.status} /> : <span className="badge-red">Missing</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {doc?.file_url ? (
                                <div className="inline-flex items-center gap-2">
                                  <button onClick={() => viewDocument(doc.file_url)} className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors" title="View">
                                    <Eye size={14} />
                                  </button>
                                  <a href={doc.file_url} download className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors" title="Download">
                                    <Download size={14} />
                                  </a>
                                </div>
                              ) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </DetailSection>

              {/* Student bank details */}
              {payment &&
                payment.payment_details_status !== 'Locked' && (
                  <DetailSection
                    title="Bank Details"
                    icon={CreditCard}
                  >
                    <InfoGrid>
                      <InfoItem
                        label="Bank Name"
                        value={payment.bank_name}
                      />

                      <InfoItem
                        label="Branch Name"
                        value={payment.branch_name}
                      />

                      <InfoItem
                        label="Account Number"
                        value={
                          payment.account_number
                            ? `${'•'.repeat(
                                Math.max(
                                  String(
                                    payment.account_number
                                  ).length - 4,
                                  0
                                )
                              )}${String(
                                payment.account_number
                              ).slice(-4)}`
                            : '—'
                        }
                        mono
                      />

                      <InfoItem
                        label="Account Holder Name"
                        value={
                          payment.account_holder_name
                        }
                      />

                      <InfoItem
                        label="Account Type"
                        value={payment.account_type}
                      />

                      <InfoItem
                        label="Contact Number"
                        value={payment.contact_number}
                      />

                      <InfoItem
                        label="Bank Details Status"
                        value={
                          payment.payment_details_status
                        }
                      />

                      <InfoItem
                        label="Verified Date"
                        value={
                          payment.payment_verified_date
                            ? format(
                                new Date(
                                  payment.payment_verified_date
                                ),
                                'MMM d, yyyy · h:mm a'
                              )
                            : null
                        }
                      />

                      {payment.admin_payment_comments && (
                        <InfoItem
                          label="Admin Comments"
                          value={
                            payment.admin_payment_comments
                          }
                          fullWidth
                        />
                      )}

                      {payment.resubmission_reason && (
                        <InfoItem
                          label="Correction Instructions"
                          value={
                            payment.resubmission_reason
                          }
                          fullWidth
                        />
                      )}

                      {payment.passbook_url && (
                        <div className="sm:col-span-2 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Bank Passbook / Account Proof
                            </p>

                            <p className="text-xs text-slate-400 mt-0.5">
                              {payment.passbook_file_name ||
                                'Uploaded bank document'}
                            </p>
                          </div>

                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                viewDocument(
                                  payment.passbook_url
                                )
                              }
                              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                            >
                              <Eye size={12} />
                              View
                            </button>

                            <a
                              href={payment.passbook_url}
                              download={
                                payment.passbook_file_name
                              }
                              className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 border border-slate-200 rounded-lg"
                            >
                              <Download size={12} />
                              Download
                            </a>
                          </div>
                        </div>
                      )}
                    </InfoGrid>
                  </DetailSection>
                )}

              {/* Actual scholarship payment */}
              {(
                scholarshipPayment ||
                [
                  'Assigned to Donor',
                  'Payment Processing',
                  'Completed',
                ].includes(app.status)
              ) && (
                <DetailSection
                  title="Scholarship Payment"
                  icon={DollarSign}
                >
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <StatusCard
                        label="Payment Status"
                        value={
                          scholarshipPayment?.payment_status ||
                          (
                            app.status === 'Completed'
                              ? 'Paid'
                              : app.status ===
                                'Payment Processing'
                              ? 'Processing'
                              : 'Pending'
                          )
                        }
                      />

                      <InfoItem
                        label="Amount Paid"
                        value={
                          scholarshipPayment?.amount
                            ? `LKR ${Number(
                                scholarshipPayment.amount
                              ).toLocaleString()}`
                            : null
                        }
                      />

                      <InfoItem
                        label="Payment Date"
                        value={
                          scholarshipPayment?.payment_date
                            ? format(
                                new Date(
                                  scholarshipPayment.payment_date
                                ),
                                'MMM d, yyyy'
                              )
                            : null
                        }
                      />

                      <InfoItem
                        label="Transaction Reference"
                        value={
                          scholarshipPayment
                            ?.transaction_reference
                        }
                        mono
                      />

                      {scholarshipPayment
                        ?.donor_comments && (
                        <InfoItem
                          label="Donor Comments"
                          value={
                            scholarshipPayment
                              .donor_comments
                          }
                          fullWidth
                        />
                      )}

                      {scholarshipPayment
                        ?.failure_reason && (
                        <InfoItem
                          label="Failure Reason"
                          value={
                            scholarshipPayment
                              .failure_reason
                          }
                          fullWidth
                        />
                      )}
                    </div>

                    {scholarshipPayment
                      ?.receipt_url && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Payment Receipt
                          </p>

                          <p className="text-xs text-slate-400 mt-0.5">
                            {scholarshipPayment
                              .receipt_file_name ||
                              'Scholarship payment receipt'}
                          </p>
                        </div>

                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              viewDocument(
                                scholarshipPayment
                                  .receipt_url
                              )
                            }
                            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                          >
                            <Eye size={12} />
                            View Receipt
                          </button>

                          <a
                            href={
                              scholarshipPayment
                                .receipt_url
                            }
                            download={
                              scholarshipPayment
                                .receipt_file_name
                            }
                            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 border border-slate-200 rounded-lg"
                          >
                            <Download size={12} />
                            Download
                          </a>
                        </div>
                      </div>
                    )}

                    {app.status === 'Completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Scholarship payment completed successfully.
                      </div>
                    )}

                    {scholarshipPayment
                      ?.payment_status ===
                      'On Hold' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                        <Clock size={16} />
                        Your scholarship payment is temporarily on hold.
                      </div>
                    )}

                    {scholarshipPayment
                      ?.payment_status ===
                      'Failed' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle size={16} />
                        The previous payment attempt was unsuccessful.
                      </div>
                    )}
                  </div>
                </DetailSection>
              )}

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white">
          <button onClick={onClose} className="btn-secondary px-6 py-2">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Status Card Helper
function StatusCard({ label, value, type = 'badge' }) {
  const getBadgeClass = (val) => {
    if (!val) return 'badge-slate'
    const clean = val.toLowerCase()
    if (
      clean.includes('approved') ||
      clean.includes('verified') ||
      clean === 'completed' ||
      clean === 'paid'
    ) {
      return 'badge-green'
    }

    if (
      clean.includes('pending') ||
      clean === 'submitted' ||
      clean === 're-submitted' ||
      clean === 'processing'
    ) {
      return 'badge-blue'
    }

    if (
      clean.includes('rejected') ||
      clean === 'missing' ||
      clean === 'failed'
    ) {
      return 'badge-red'
    }

    if (
      clean.includes('correction') ||
      clean.includes('resubmission') ||
      clean.includes('review') ||
      clean === 'on hold'
    ) {
      return 'badge-amber'
    }
    return 'badge-slate'
  }

  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100/50">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex justify-center">
        {type === 'status' ? (
          <StatusBadge status={value} />
        ) : (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeClass(value)}`}>
            {value || 'Pending'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Detail Section Wrapper
function DetailSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3.5">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        {Icon && <Icon size={15} className="text-purple-600" />}
        <h3 className="font-bold text-sm text-slate-800">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  )
}

// ── Info Grid Wrapper
function InfoGrid({ children }) {
  return <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>
}

// ── Info Item Wrapper
function InfoItem({ label, value, mono, fullWidth }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-slate-700 ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-300 font-normal">—</span>}
      </p>
    </div>
  )
}