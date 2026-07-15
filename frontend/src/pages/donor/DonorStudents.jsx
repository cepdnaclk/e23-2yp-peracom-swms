import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import toast from 'react-hot-toast'

import api from '../../services/api'


// ─────────────────────────────────────────────────────────────
// Actual scholarship payment status badge
// ─────────────────────────────────────────────────────────────
function PaymentStatusBadge({ status }) {
  const currentStatus =
    status || 'Pending'

  if (currentStatus === 'Paid') {
    return (
      <span className="inline-flex items-center gap-1 badge-green">
        <CheckCircle size={10} />
        Paid
      </span>
    )
  }

  if (currentStatus === 'Processing') {
    return (
      <span className="inline-flex items-center gap-1 badge-blue">
        <Clock size={10} />
        Processing
      </span>
    )
  }

  if (currentStatus === 'On Hold') {
    return (
      <span className="inline-flex items-center gap-1 badge-amber">
        <Clock size={10} />
        On Hold
      </span>
    )
  }

  if (currentStatus === 'Failed') {
    return (
      <span className="inline-flex items-center gap-1 badge-red">
        Failed
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 badge-grey">
      <Clock size={10} />
      Pending
    </span>
  )
}


// ─────────────────────────────────────────────────────────────
// Application status badge
// ─────────────────────────────────────────────────────────────
function AssignmentBadge({ status }) {
  if (status === 'Completed') {
    return (
      <span className="badge-green">
        Completed
      </span>
    )
  }

  if (status === 'Payment Processing') {
    return (
      <span className="badge-blue">
        Payment Processing
      </span>
    )
  }

  return (
    <span className="badge-purple">
      Assigned
    </span>
  )
}


export default function DonorStudents() {
  const navigate = useNavigate()

  const [students, setStudents] =
    useState([])

  const [scholarships, setScholarships] =
    useState([])

  const [search, setSearch] =
    useState('')

  const [
    filterScholarship,
    setFilterScholarship,
  ] = useState('')

  const [
    filterBatch,
    setFilterBatch,
  ] = useState('')

  const [
    filterPayment,
    setFilterPayment,
  ] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)


  const load = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const [
          studentsResponse,
          scholarshipsResponse,
        ] = await Promise.all([
          api.get('/donor/students'),
          api.get('/donor/scholarships'),
        ])

        setStudents(
          Array.isArray(
            studentsResponse.data
          )
            ? studentsResponse.data
            : []
        )

        setScholarships(
          Array.isArray(
            scholarshipsResponse.data
          )
            ? scholarshipsResponse.data
            : []
        )
      } catch (error) {
        console.error(
          'Load donor students error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to load assigned students'
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )


  useEffect(() => {
    load()
  }, [load])


  // Refresh every 30 seconds so payment changes
  // appear without manually reloading the page.
  useEffect(() => {
    const intervalId =
      window.setInterval(
        () => load(true),
        30000
      )

    return () =>
      window.clearInterval(intervalId)
  }, [load])


  const batchOptions = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map(student => student.batch)
            .filter(Boolean)
        )
      ).sort(),
    [students]
  )


  const filteredStudents = useMemo(
    () => {
      const searchValue =
        search.trim().toLowerCase()

      return students.filter(student => {
        const matchesSearch =
          !searchValue ||
          [
            student.student_name,
            student.registration_number,
            student.scholarship_title,
          ]
            .filter(Boolean)
            .some(value =>
              String(value)
                .toLowerCase()
                .includes(searchValue)
            )

        const matchesScholarship =
          !filterScholarship ||
          String(
            student.scholarship_id
          ) ===
            String(filterScholarship)

        const matchesBatch =
          !filterBatch ||
          String(student.batch) ===
            String(filterBatch)

        const currentPaymentStatus =
          student.payment_status ||
          'Pending'

        const matchesPayment =
          !filterPayment ||
          currentPaymentStatus ===
            filterPayment

        return (
          matchesSearch &&
          matchesScholarship &&
          matchesBatch &&
          matchesPayment
        )
      })
    },
    [
      students,
      search,
      filterScholarship,
      filterBatch,
      filterPayment,
    ]
  )


  const counts = useMemo(
    () => ({
      total: students.length,

      pending: students.filter(
        student =>
          !student.payment_status ||
          student.payment_status ===
            'Pending'
      ).length,

      processing: students.filter(
        student =>
          student.payment_status ===
          'Processing'
      ).length,

      paid: students.filter(
        student =>
          student.payment_status ===
          'Paid'
      ).length,

      onHold: students.filter(
        student =>
          student.payment_status ===
          'On Hold'
      ).length,

      failed: students.filter(
        student =>
          student.payment_status ===
          'Failed'
      ).length,
    }),
    [students]
  )


  const getRowBorder = student => {
    const status =
      student.payment_status ||
      'Pending'

    if (status === 'Paid') {
      return 'border-l-2 border-l-green-500'
    }

    if (status === 'Processing') {
      return 'border-l-2 border-l-blue-500'
    }

    if (status === 'On Hold') {
      return 'border-l-2 border-l-amber-500'
    }

    if (status === 'Failed') {
      return 'border-l-2 border-l-red-500'
    }

    return 'border-l-2 border-l-slate-300'
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">
            Assigned Students
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            View students already selected and
            verified by the admin, then process
            scholarship payments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-ghost flex items-center gap-1.5 text-sm disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? 'animate-spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>


      {/* Information banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck
          size={18}
          className="text-blue-600 flex-shrink-0 mt-0.5"
        />

        <div>
          <p className="font-semibold text-blue-800 text-sm">
            Students are already approved
          </p>

          <p className="text-xs text-blue-700 mt-0.5">
            The admin has already reviewed the
            application, verified the documents,
            and verified the student's bank
            details. You do not need to approve
            or reject the student again.
          </p>
        </div>
      </div>


      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Total Assigned',
            value: counts.total,
            color:
              'bg-purple-50 text-purple-700',
          },
          {
            label: 'Pending Payment',
            value: counts.pending,
            color:
              'bg-slate-50 text-slate-700',
          },
          {
            label: 'Processing',
            value: counts.processing,
            color:
              'bg-blue-50 text-blue-700',
          },
          {
            label: 'Paid',
            value: counts.paid,
            color:
              'bg-green-50 text-green-700',
          },
          {
            label: 'On Hold',
            value: counts.onHold,
            color:
              'bg-amber-50 text-amber-700',
          },
          {
            label: 'Failed',
            value: counts.failed,
            color:
              'bg-red-50 text-red-700',
          },
        ].map(
          ({
            label,
            value,
            color,
          }) => (
            <div
              key={label}
              className={`card p-3 text-center ${color}`}
            >
              <p className="text-xs font-medium opacity-70">
                {label}
              </p>

              <p className="text-xl font-extrabold mt-0.5">
                {value}
              </p>
            </div>
          )
        )}
      </div>


      {/* Payment shortcut */}
      {counts.pending +
        counts.processing +
        counts.onHold >
        0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <CreditCard
              size={18}
              className="text-amber-600 flex-shrink-0"
            />

            <div>
              <p className="font-semibold text-amber-800 text-sm">
                Scholarship payments require
                attention
              </p>

              <p className="text-xs text-amber-700 mt-0.5">
                Use the existing Payments page
                to process pending, processing,
                or on-hold payments.
              </p>
            </div>
          </div>

          <Link
            to="/donor/payments"
            className="btn-primary text-sm flex-shrink-0 flex items-center gap-1.5"
          >
            <CreditCard size={14} />
            Open Payments
          </Link>
        </div>
      )}


      {/* Filters */}
      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search student or registration..."
            className="input-field pl-8"
          />
        </div>

        <select
          value={filterScholarship}
          onChange={event =>
            setFilterScholarship(
              event.target.value
            )
          }
          className="input-field"
        >
          <option value="">
            All Scholarships
          </option>

          {scholarships.map(
            scholarship => (
              <option
                key={scholarship.id}
                value={scholarship.id}
              >
                {scholarship.title}
              </option>
            )
          )}
        </select>

        <select
          value={filterBatch}
          onChange={event =>
            setFilterBatch(
              event.target.value
            )
          }
          className="input-field"
        >
          <option value="">
            All Batches
          </option>

          {batchOptions.map(batch => (
            <option
              key={batch}
              value={batch}
            >
              {batch}
            </option>
          ))}
        </select>

        <select
          value={filterPayment}
          onChange={event =>
            setFilterPayment(
              event.target.value
            )
          }
          className="input-field"
        >
          <option value="">
            All Payment Statuses
          </option>

          {[
            'Pending',
            'Processing',
            'Paid',
            'On Hold',
            'Failed',
          ].map(status => (
            <option
              key={status}
              value={status}
            >
              {status}
            </option>
          ))}
        </select>
      </div>


      {/* Student table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {[
                'Student',
                'Scholarship',
                'Batch',
                'GPA',
                'Assignment',
                'Payment Status',
                'Action',
              ].map(heading => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  Loading assigned students...
                </td>
              </tr>
            ) : filteredStudents.length ===
              0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No assigned students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map(
                student => {
                  const paymentStatus =
                    student.payment_status ||
                    'Pending'

                  return (
                    <tr
                      key={
                        student.assignment_id ||
                        student.application_id
                      }
                      className={`transition-colors hover:bg-slate-50/60 ${getRowBorder(
                        student
                      )}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {
                            student.student_name
                          }
                        </p>

                        <p className="text-xs text-slate-400 font-mono">
                          {student.registration_number ||
                            '—'}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px]">
                        <p className="truncate">
                          {
                            student.scholarship_title
                          }
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="badge-purple">
                          {student.batch || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`font-bold text-sm ${
                            Number(
                              student.gpa
                            ) >= 3.5
                              ? 'text-green-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {student.gpa
                            ? Number(
                                student.gpa
                              ).toFixed(2)
                            : '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <AssignmentBadge
                          status={
                            student.application_status
                          }
                        />
                      </td>

                      <td className="px-4 py-3">
                        <PaymentStatusBadge
                          status={paymentStatus}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/donor/students/${student.assignment_id}/review`
                              )
                            }
                            className="flex items-center gap-1.5 btn-ghost text-xs px-3 py-1.5"
                          >
                            <Eye size={12} />
                            View Student
                          </button>

                          {paymentStatus !==
                            'Paid' && (
                            <Link
                              to="/donor/payments"
                              className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                              <CreditCard
                                size={12}
                              />
                              Process Payment
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                }
              )
            )}
          </tbody>
        </table>

        {!loading &&
          filteredStudents.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-50 text-xs text-slate-400 flex items-center gap-2">
            <Users size={13} />

            Showing{' '}
            {filteredStudents.length} of{' '}
            {students.length} students

            {refreshing && (
              <span className="text-purple-500">
                • Refreshing…
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}