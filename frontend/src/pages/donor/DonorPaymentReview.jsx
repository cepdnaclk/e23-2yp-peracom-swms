import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Hash,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Upload,
  User,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

import api from '../../services/api'
import { viewDocument } from '../../utils/viewDocument'

const ALLOWED_RECEIPT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

const MAX_RECEIPT_SIZE =
  5 * 1024 * 1024

function cleanNumber(value) {
  const parsed = Number.parseFloat(value)

  return Number.isNaN(parsed)
    ? null
    : parsed
}

function maskAccountNumber(value) {
  if (!value) {
    return '—'
  }

  const accountNumber = String(value)

  if (accountNumber.length <= 4) {
    return accountNumber
  }

  return `${'•'.repeat(
    accountNumber.length - 4
  )}${accountNumber.slice(-4)}`
}

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
        <PauseCircle size={10} />
        On Hold
      </span>
    )
  }

  if (currentStatus === 'Failed') {
    return (
      <span className="inline-flex items-center gap-1 badge-red">
        <XCircle size={10} />
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

function DetailCard({
  label,
  value,
  icon: Icon,
  mono = false,
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-1">
        {Icon && <Icon size={11} />}
        {label}
      </p>

      <p
        className={`text-sm font-bold text-slate-800 ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value || '—'}
      </p>
    </div>
  )
}

export default function DonorPaymentReview() {
  const [students, setStudents] =
    useState([])

  const [selected, setSelected] =
    useState(null)

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [detailLoading, setDetailLoading] =
    useState(false)

  const [refreshing, setRefreshing] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [action, setAction] =
    useState(null)

  const [amount, setAmount] =
    useState('')

  const [
    transactionReference,
    setTransactionReference,
  ] = useState('')

  const [paymentDate, setPaymentDate] =
    useState('')

  const [comments, setComments] =
    useState('')

  const [holdReason, setHoldReason] =
    useState('')

  const [failureReason, setFailureReason] =
    useState('')

  const [receiptFile, setReceiptFile] =
    useState(null)

  const loadStudents = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const response =
          await api.get('/donor/students')

        setStudents(
          Array.isArray(response.data)
            ? response.data
            : []
        )
      } catch (error) {
        console.error(
          'Load donor payments error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to load assigned payments'
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  useEffect(() => {
    const intervalId =
      window.setInterval(
        () => loadStudents(true),
        30000
      )

    return () =>
      window.clearInterval(intervalId)
  }, [loadStudents])

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

        const paymentStatus =
          student.payment_status ||
          'Pending'

        const matchesStatus =
          !statusFilter ||
          paymentStatus ===
            statusFilter

        return (
          matchesSearch &&
          matchesStatus
        )
      })
    },
    [
      students,
      search,
      statusFilter,
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

  const resetForm = () => {
    setAction(null)
    setAmount('')
    setTransactionReference('')
    setPaymentDate('')
    setComments('')
    setHoldReason('')
    setFailureReason('')
    setReceiptFile(null)
  }

  const loadStudentDetail =
    async student => {
      setDetailLoading(true)
      resetForm()

      try {
        const response = await api.get(
          `/donor/students/${student.assignment_id}`
        )

        const detail = response.data

        setSelected(detail)

        setAmount(
          detail.paid_amount ||
            ''
        )

        setTransactionReference(
          detail.transaction_reference ||
            ''
        )

        if (detail.payment_date) {
          setPaymentDate(
            new Date(
              detail.payment_date
            )
              .toISOString()
              .slice(0, 10)
          )
        }
      } catch (error) {
        console.error(
          'Load donor payment detail error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to load payment information'
        )
      } finally {
        setDetailLoading(false)
      }
    }

  const refreshSelected =
    async () => {
      if (!selected?.assignment_id) {
        return
      }

      setRefreshing(true)

      try {
        const response = await api.get(
          `/donor/students/${selected.assignment_id}`
        )

        setSelected(response.data)
        await loadStudents(true)
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            'Failed to refresh payment'
        )
      } finally {
        setRefreshing(false)
      }
    }

  const handleReceiptChange =
    event => {
      const file =
        event.target.files?.[0]

      if (!file) {
        setReceiptFile(null)
        return
      }

      if (
        !ALLOWED_RECEIPT_TYPES.includes(
          file.type
        )
      ) {
        toast.error(
          'Only PDF, JPG and PNG files are allowed'
        )

        event.target.value = ''
        return
      }

      if (
        file.size > MAX_RECEIPT_SIZE
      ) {
        toast.error(
          'Receipt file must not exceed 5 MB'
        )

        event.target.value = ''
        return
      }

      setReceiptFile(file)
    }

  const handleStartProcessing =
    async () => {
      if (!selected) {
        return
      }

      setSubmitting(true)

      try {
        await api.post(
          `/payment/${selected.application_id}/process`,
          {
            donor_comments:
              comments.trim(),
          }
        )

        toast.success(
          'Payment marked as processing'
        )

        resetForm()
        await refreshSelected()
      } catch (error) {
        console.error(
          'Start payment processing error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to start payment processing'
        )
      } finally {
        setSubmitting(false)
      }
    }

  const handlePutOnHold =
    async () => {
      if (!holdReason.trim()) {
        toast.error(
          'Please provide a reason'
        )
        return
      }

      setSubmitting(true)

      try {
        await api.post(
          `/payment/${selected.application_id}/hold`,
          {
            reason:
              holdReason.trim(),

            donor_comments:
              comments.trim(),
          }
        )

        toast.success(
          'Payment placed on hold'
        )

        resetForm()
        await refreshSelected()
      } catch (error) {
        console.error(
          'Put payment on hold error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to place payment on hold'
        )
      } finally {
        setSubmitting(false)
      }
    }

  const handleMarkFailed =
    async () => {
      if (!failureReason.trim()) {
        toast.error(
          'Please provide a failure reason'
        )
        return
      }

      setSubmitting(true)

      try {
        await api.post(
          `/payment/${selected.application_id}/fail`,
          {
            failure_reason:
              failureReason.trim(),

            donor_comments:
              comments.trim(),
          }
        )

        toast.success(
          'Payment marked as failed'
        )

        resetForm()
        await refreshSelected()
      } catch (error) {
        console.error(
          'Mark payment failed error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to update payment status'
        )
      } finally {
        setSubmitting(false)
      }
    }

  const handleMarkPaid =
    async () => {
      const finalAmount =
        cleanNumber(amount)

      if (
        finalAmount === null ||
        finalAmount <= 0
      ) {
        toast.error(
          'Enter a valid payment amount'
        )
        return
      }

      if (
        !transactionReference.trim()
      ) {
        toast.error(
          'Transaction reference is required'
        )
        return
      }

      if (!paymentDate) {
        toast.error(
          'Payment date is required'
        )
        return
      }

      if (!receiptFile) {
        toast.error(
          'Upload the payment receipt'
        )
        return
      }

      const formData =
        new FormData()

      formData.append(
        'amount',
        String(finalAmount)
      )

      formData.append(
        'transaction_reference',
        transactionReference.trim()
      )

      formData.append(
        'payment_date',
        paymentDate
      )

      formData.append(
        'donor_comments',
        comments.trim()
      )

      formData.append(
        'receipt',
        receiptFile
      )

      setSubmitting(true)

      try {
        await api.post(
          `/payment/${selected.application_id}/complete`,
          formData
        )

        toast.success(
          'Scholarship payment recorded successfully'
        )

        resetForm()
        await refreshSelected()
      } catch (error) {
        console.error(
          'Complete scholarship payment error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to record scholarship payment'
        )
      } finally {
        setSubmitting(false)
      }
    }

  if (detailLoading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading payment information...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {!selected ? (
        <>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="page-title">
                Scholarship Payments
              </h1>

              <p className="text-slate-500 text-sm mt-1">
                Process and record payments
                for students assigned and
                verified by the admin.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadStudents(true)
              }
              disabled={refreshing}
              className="btn-ghost flex items-center gap-2 disabled:opacity-50"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: 'Total',
                value: counts.total,
                color:
                  'bg-purple-50 text-purple-700',
              },
              {
                label: 'Pending',
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

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle
              size={18}
              className="text-blue-600 flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="font-semibold text-blue-800 text-sm">
                Bank details already verified
              </p>

              <p className="text-xs text-blue-700 mt-0.5">
                The admin has already
                verified the student's
                account details. This page
                records the actual
                scholarship payment.
              </p>
            </div>
          </div>

          <div className="card p-4 grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={event =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search student, registration or scholarship..."
                className="input-field pl-8"
              />
            </div>

            <select
              value={statusFilter}
              onChange={event =>
                setStatusFilter(
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

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {[
                    'Student',
                    'Scholarship',
                    'Batch',
                    'Assigned',
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
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredStudents.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No assigned payments
                      found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(
                    student => (
                      <tr
                        key={
                          student.assignment_id
                        }
                        className="hover:bg-slate-50/60 transition-colors"
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

                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px]">
                          <p className="truncate">
                            {
                              student.scholarship_title
                            }
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="badge-purple">
                            {student.batch ||
                              '—'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-400">
                          {student.assigned_at
                            ? format(
                                new Date(
                                  student.assigned_at
                                ),
                                'MMM d, yyyy'
                              )
                            : '—'}
                        </td>

                        <td className="px-4 py-3">
                          <PaymentStatusBadge
                            status={
                              student.payment_status
                            }
                          />
                        </td>

                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              loadStudentDetail(
                                student
                              )
                            }
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                          >
                            <CreditCard
                              size={12}
                            />

                            {student.payment_status ===
                            'Paid'
                              ? 'View Payment'
                              : 'Process Payment'}
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-purple-600 font-semibold mb-1">
                {selected.scholarship_title}
              </p>

              <h1 className="page-title">
                {selected.student_name}
              </h1>

              <p className="text-xs text-slate-400 mt-1">
                {selected.registration_number ||
                  '—'}{' '}
                · Batch{' '}
                {selected.batch || '—'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <PaymentStatusBadge
                status={
                  selected.payment_status
                }
              />

              <button
                type="button"
                onClick={() => {
                  setSelected(null)
                  resetForm()
                }}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <ArrowLeft size={14} />
                Back to Payments
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <CreditCard
                size={16}
                className="text-green-600"
              />
              Admin-Verified Bank Details
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailCard
                label="Account Holder Name"
                value={
                  selected.account_holder_name
                }
                icon={User}
              />

              <DetailCard
                label="Bank Name"
                value={selected.bank_name}
                icon={Building}
              />

              <DetailCard
                label="Branch Name"
                value={selected.branch_name}
                icon={Building}
              />

              <DetailCard
                label="Account Number"
                value={maskAccountNumber(
                  selected.account_number
                )}
                icon={Hash}
                mono
              />

              <DetailCard
                label="Account Type"
                value={selected.account_type}
                icon={CreditCard}
              />

              <DetailCard
                label="Verified Date"
                value={
                  selected.payment_verified_date
                    ? format(
                        new Date(
                          selected.payment_verified_date
                        ),
                        'MMM d, yyyy'
                      )
                    : null
                }
                icon={Calendar}
              />
            </div>

            {selected.passbook_url && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
                  <FileText size={13} />
                  Bank Passbook / Account
                  Proof
                </p>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <FileText
                    size={15}
                    className="text-green-600 flex-shrink-0"
                  />

                  <p className="text-sm text-green-700 flex-1 truncate font-medium">
                    {selected.passbook_file_name ||
                      'Bank account proof'}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      viewDocument(
                        selected.passbook_url
                      )
                    }
                    className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    <Eye size={13} />
                    View
                  </button>

                  <a
                    href={
                      selected.passbook_url
                    }
                    download={
                      selected.passbook_file_name
                    }
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    <Download size={13} />
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>

          {selected.payment_status ===
          'Paid' ? (
            <div className="card p-6 border-2 border-green-100">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-5">
                <CheckCircle
                  size={20}
                  className="text-green-600"
                />

                <div>
                  <p className="font-semibold text-green-700">
                    Scholarship payment
                    completed
                  </p>

                  <p className="text-xs text-green-600">
                    This transaction has been
                    recorded successfully.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <DetailCard
                  label="Paid Amount"
                  value={
                    selected.paid_amount
                      ? `LKR ${Number(
                          selected.paid_amount
                        ).toLocaleString()}`
                      : null
                  }
                  icon={CreditCard}
                />

                <DetailCard
                  label="Payment Date"
                  value={
                    selected.payment_date
                      ? format(
                          new Date(
                            selected.payment_date
                          ),
                          'MMM d, yyyy'
                        )
                      : null
                  }
                  icon={Calendar}
                />

                <DetailCard
                  label="Transaction Reference"
                  value={
                    selected.transaction_reference
                  }
                  icon={Hash}
                  mono
                />

                <DetailCard
                  label="Doner Comments"
                  value={
                    selected.donor_comments
                  }
                  icon={FileText}
                />
              </div>

              {selected.receipt_url && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      viewDocument(
                        selected.receipt_url
                      )
                    }
                    className="btn-ghost flex items-center gap-2"
                  >
                    <Eye size={14} />
                    View Payment Receipt
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-6 border-2 border-purple-100 space-y-5">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Payment Action
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Update the progress or record
                  the completed scholarship
                  transfer.
                </p>
              </div>

              {!action && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setAction('process')
                    }
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={16} />
                    Start Processing
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAction('paid')
                    }
                    className="bg-green-50 text-green-700 hover:bg-green-100 rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Mark as Paid
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAction('hold')
                    }
                    className="bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <PauseCircle size={16} />
                    Put On Hold
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAction('failed')
                    }
                    className="bg-red-50 text-red-700 hover:bg-red-100 rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Mark Failed
                  </button>
                </div>
              )}

              {action === 'process' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                  <p className="font-semibold text-blue-700 flex items-center gap-2">
                    <PlayCircle size={16} />
                    Start Payment Processing
                  </p>

                  <textarea
                    value={comments}
                    onChange={event =>
                      setComments(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Optional processing comments..."
                    className="input-field resize-none"
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={
                        handleStartProcessing
                      }
                      disabled={submitting}
                      className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {submitting
                        ? 'Processing...'
                        : 'Confirm Processing'}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {action === 'hold' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                  <p className="font-semibold text-amber-700 flex items-center gap-2">
                    <PauseCircle size={16} />
                    Put Payment On Hold
                  </p>

                  <textarea
                    value={holdReason}
                    onChange={event =>
                      setHoldReason(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Explain why this payment is being placed on hold..."
                    className="input-field resize-none"
                  />

                  <textarea
                    value={comments}
                    onChange={event =>
                      setComments(
                        event.target.value
                      )
                    }
                    rows={2}
                    placeholder="Additional comments (optional)..."
                    className="input-field resize-none"
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePutOnHold}
                      disabled={
                        submitting ||
                        !holdReason.trim()
                      }
                      className="bg-amber-500 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {submitting
                        ? 'Saving...'
                        : 'Confirm Hold'}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {action === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-4">
                  <p className="font-semibold text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Mark Payment Failed
                  </p>

                  <textarea
                    value={failureReason}
                    onChange={event =>
                      setFailureReason(
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Explain why the payment failed..."
                    className="input-field resize-none"
                  />

                  <textarea
                    value={comments}
                    onChange={event =>
                      setComments(
                        event.target.value
                      )
                    }
                    rows={2}
                    placeholder="Additional comments (optional)..."
                    className="input-field resize-none"
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleMarkFailed}
                      disabled={
                        submitting ||
                        !failureReason.trim()
                      }
                      className="bg-red-600 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {submitting
                        ? 'Saving...'
                        : 'Confirm Failed'}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {action === 'paid' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
                  <p className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle size={16} />
                    Record Completed Payment
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Amount (LKR) *
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={event =>
                          setAmount(
                            event.target.value
                          )
                        }
                        className="input-field"
                        placeholder="10000.00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Payment Date *
                      </label>

                      <input
                        type="date"
                        value={paymentDate}
                        onChange={event =>
                          setPaymentDate(
                            event.target.value
                          )
                        }
                        className="input-field"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Transaction Reference *
                      </label>

                      <input
                        value={
                          transactionReference
                        }
                        onChange={event =>
                          setTransactionReference(
                            event.target.value
                          )
                        }
                        className="input-field"
                        placeholder="Bank transaction/reference number"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Payment Receipt *
                      </label>

                      <label className="border-2 border-dashed border-green-200 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-green-100/40">
                        <Upload
                          size={16}
                          className="text-green-600"
                        />

                        <span className="text-sm text-green-700 font-medium">
                          {receiptFile
                            ? receiptFile.name
                            : 'Upload PDF, JPG or PNG'}
                        </span>

                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={
                            handleReceiptChange
                          }
                          className="hidden"
                        />
                      </label>

                      <p className="text-xs text-slate-400 mt-1">
                        Maximum file size: 5 MB
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Doner Comments
                      </label>

                      <textarea
                        value={comments}
                        onChange={event =>
                          setComments(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="Optional payment comments..."
                        className="input-field resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleMarkPaid}
                      disabled={submitting}
                      className="bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {submitting
                        ? 'Recording...'
                        : 'Confirm Payment'}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={refreshSelected}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh Payment Details
          </button>
        </div>
      )}
    </div>
  )
}