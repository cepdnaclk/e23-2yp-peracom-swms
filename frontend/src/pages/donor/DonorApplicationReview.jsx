import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  GraduationCap,
  Hash,
  Home,
  Info,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  User,
  Users,
} from 'lucide-react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

import { Breadcrumb } from '../../components/common/Breadcrumb'
import { StatusBadge } from '../../components/common/StatusBadge'
import { viewDocument } from '../../utils/viewDocument'
import api from '../../services/api'

const COMMON_REQUIRED_DOCS = [
  'NIC Copy',
  'Academic Transcript',
  'Faculty Acceptance Letter',
  'Student Request Letter',
  'University ID Copy',
]

function parseExtra(raw) {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function Section({
  title,
  icon: Icon,
  color = 'purple',
  children,
  collapsible = false,
  defaultOpen = true,
  badge,
}) {
  const [open, setOpen] = useState(defaultOpen)

  const colors = {
    purple:
      'bg-purple-50 text-purple-700 border-purple-100',
    blue:
      'bg-blue-50 text-blue-700 border-blue-100',
    green:
      'bg-green-50 text-green-700 border-green-100',
    amber:
      'bg-amber-50 text-amber-700 border-amber-100',
    red:
      'bg-red-50 text-red-700 border-red-100',
    slate:
      'bg-slate-50 text-slate-700 border-slate-100',
  }

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => {
          if (collapsible) {
            setOpen(current => !current)
          }
        }}
        className={`w-full flex items-center justify-between px-6 py-4 border-b ${
          colors[color]
        } ${
          collapsible
            ? 'cursor-pointer hover:opacity-80'
            : 'cursor-default'
        }`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={17} />}

          <h2 className="font-semibold text-sm">
            {title}
          </h2>

          {badge && (
            <span className="ml-2 badge-purple text-xs">
              {badge}
            </span>
          )}
        </div>

        {collapsible &&
          (open ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          ))}
      </button>

      {open && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  )
}

function InfoGrid({ children }) {
  return (
    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
      {children}
    </div>
  )
}

function InfoItem({
  label,
  value,
  icon: Icon,
  mono,
  highlight,
  fullWidth,
}) {
  const highlightClass =
    highlight === 'green'
      ? 'text-green-600'
      : highlight === 'red'
      ? 'text-red-600'
      : highlight === 'amber'
      ? 'text-amber-600'
      : highlight === 'blue'
      ? 'text-blue-600'
      : 'text-slate-800'

  return (
    <div
      className={
        fullWidth
          ? 'sm:col-span-2'
          : ''
      }
    >
      <p className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-0.5">
        {Icon && <Icon size={11} />}
        {label}
      </p>

      <p
        className={`text-sm font-semibold ${highlightClass} ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value || (
          <span className="text-slate-300 font-normal">
            —
          </span>
        )}
      </p>
    </div>
  )
}

function GPABar({ gpa }) {
  if (!gpa) {
    return (
      <p className="text-sm text-slate-400">
        GPA information is unavailable.
      </p>
    )
  }

  const value = Number.parseFloat(gpa)

  if (Number.isNaN(value)) {
    return null
  }

  const percentage = Math.min(
    Math.max((value / 4) * 100, 0),
    100
  )

  const barColor =
    value >= 3.5
      ? 'bg-green-500'
      : value >= 3
      ? 'bg-blue-500'
      : value >= 2.5
      ? 'bg-amber-400'
      : 'bg-red-400'

  const textColor =
    value >= 3.5
      ? 'text-green-600'
      : value >= 3
      ? 'text-blue-600'
      : value >= 2.5
      ? 'text-amber-600'
      : 'text-red-500'

  const label =
    value >= 3.5
      ? 'Excellent'
      : value >= 3
      ? 'Good'
      : value >= 2.5
      ? 'Average'
      : 'Below Average'

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl">
      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>0.00</span>
        <span>4.00</span>
      </div>

      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span
          className={`text-xs font-bold ${textColor}`}
        >
          {label}
        </span>

        <span className="text-xs font-mono text-slate-500 font-semibold">
          {value.toFixed(2)} / 4.00
        </span>
      </div>
    </div>
  )
}

function NeedIndicator({
  income,
  dependents,
}) {
  if (!income) {
    return null
  }

  const perPerson =
    dependents > 0
      ? income / dependents
      : income

  const level =
    perPerson < 5000
      ? {
          label: 'High Need',
          color:
            'bg-red-100 text-red-700 border-red-200',
        }
      : perPerson < 15000
      ? {
          label: 'Moderate Need',
          color:
            'bg-amber-100 text-amber-700 border-amber-200',
        }
      : {
          label: 'Low Need',
          color:
            'bg-green-100 text-green-700 border-green-200',
        }

  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full border ${level.color}`}
    >
      {level.label}
    </span>
  )
}

function SchoolSiblingTable({
  siblings = [],
}) {
  if (!siblings.length) {
    return (
      <p className="text-sm text-slate-400 italic py-2">
        No school-going siblings listed.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {[
              'Name',
              'Date of Birth',
              'Age',
              'School',
            ].map(heading => (
              <th
                key={heading}
                className="px-3 py-2.5 text-left text-slate-500 font-semibold uppercase tracking-wide"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-50">
          {siblings.map((sibling, index) => {
            const age = sibling.dob
              ? Math.floor(
                  (Date.now() -
                    new Date(
                      sibling.dob
                    ).getTime()) /
                    (1000 *
                      60 *
                      60 *
                      24 *
                      365.25)
                )
              : null

            return (
              <tr
                key={`${sibling.name || 'school'}-${index}`}
                className="hover:bg-slate-50/60"
              >
                <td className="px-3 py-2.5 font-medium text-slate-700">
                  {sibling.name || '—'}
                </td>

                <td className="px-3 py-2.5 text-slate-500">
                  {sibling.dob
                    ? format(
                        new Date(
                          sibling.dob
                        ),
                        'MMM d, yyyy'
                      )
                    : '—'}
                </td>

                <td className="px-3 py-2.5">
                  {age !== null
                    ? `${age} yrs`
                    : '—'}
                </td>

                <td className="px-3 py-2.5 text-slate-600">
                  {sibling.school || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function UniSiblingTable({
  siblings = [],
}) {
  if (!siblings.length) {
    return (
      <p className="text-sm text-slate-400 italic py-2">
        No university siblings listed.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {[
              'Name',
              'University / Institute',
              'Course',
              'A/L Year',
              'A/L Index',
              'Mahapola',
            ].map(heading => (
              <th
                key={heading}
                className="px-3 py-2.5 text-left text-slate-500 font-semibold uppercase tracking-wide"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-50">
          {siblings.map((sibling, index) => (
            <tr
              key={`${sibling.name || 'university'}-${index}`}
              className="hover:bg-slate-50/60"
            >
              <td className="px-3 py-2.5 font-medium text-slate-700">
                {sibling.name || '—'}
              </td>

              <td className="px-3 py-2.5 text-slate-600">
                {sibling.university || '—'}
              </td>

              <td className="px-3 py-2.5 text-slate-600">
                {sibling.course || '—'}
              </td>

              <td className="px-3 py-2.5 text-slate-500">
                {sibling.al_year || '—'}
              </td>

              <td className="px-3 py-2.5 font-mono text-slate-500">
                {sibling.al_index || '—'}
              </td>

              <td className="px-3 py-2.5">
                {sibling.mahapola === 'Yes' ? (
                  <span className="badge-green">
                    Yes
                  </span>
                ) : sibling.mahapola ===
                  'No' ? (
                  <span className="badge-grey">
                    No
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DocRow({ name, doc }) {
  const statusDot = !doc
    ? 'bg-red-400'
    : doc.status === 'Verified'
    ? 'bg-green-500'
    : 'bg-blue-400'

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3 w-8">
        <span
          className={`w-2.5 h-2.5 rounded-full inline-block ${statusDot}`}
        />
      </td>

      <td className="px-4 py-3">
        <p className="font-medium text-slate-800 text-sm">
          {name}
        </p>

        {doc?.file_name && (
          <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]">
            {doc.file_name}
          </p>
        )}
      </td>

      <td className="px-4 py-3 text-xs text-slate-400">
        {doc?.created_at
          ? format(
              new Date(doc.created_at),
              'MMM d, yyyy'
            )
          : '—'}
      </td>

      <td className="px-4 py-3">
        <StatusBadge
          status={doc?.status || 'Missing'}
        />
      </td>

      <td className="px-4 py-3">
        {doc?.file_url ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                viewDocument(doc.file_url)
              }
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              <Eye size={12} />
              View
            </button>

            <span className="text-slate-200">
              |
            </span>

            <a
              href={doc.file_url}
              download={doc.file_name}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              <Download size={12} />
              Download
            </a>
          </div>
        ) : (
          <span className="text-xs text-slate-300">
            Not uploaded
          </span>
        )}
      </td>
    </tr>
  )
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

function ScholarshipPaymentBadge({
  status,
}) {
  const currentStatus =
    status || 'Pending'

  if (currentStatus === 'Paid') {
    return (
      <span className="badge-green">
        Paid
      </span>
    )
  }

  if (currentStatus === 'Processing') {
    return (
      <span className="badge-blue">
        Processing
      </span>
    )
  }

  if (currentStatus === 'On Hold') {
    return (
      <span className="badge-amber">
        On Hold
      </span>
    )
  }

  if (currentStatus === 'Failed') {
    return (
      <span className="badge-red">
        Failed
      </span>
    )
  }

  return (
    <span className="badge-grey">
      Pending
    </span>
  )
}

export default function DonorApplicationReview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [assignment, setAssignment] =
    useState(null)

  const [documents, setDocuments] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const load = async (silent = false) => {
  if (silent) {
    setRefreshing(true)
  } else {
    setLoading(true)
  }

  try {
    // First load the assigned student's full application.
    const assignmentResponse = await api.get(
      `/donor/students/${id}`
    )

    const application = assignmentResponse.data

    if (!application?.application_id) {
      throw new Error(
        'Application ID was not returned by the donor API'
      )
    }

    // Then load documents using the real application ID.
    const documentResponse = await api.get(
      `/applications/${application.application_id}/documents`
    )

    setAssignment(application)

    setDocuments(
      Array.isArray(documentResponse.data)
        ? documentResponse.data
        : []
    )
  } catch (error) {
    console.error(
      'Load donor student detail error:',
      error
    )

    toast.error(
      error?.response?.data?.message ||
        error.message ||
        'Could not load assigned student'
    )

    setAssignment(null)
    setDocuments([])
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
}

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    const intervalId =
      window.setInterval(
        () => load(true),
        30000
      )

    return () =>
      window.clearInterval(intervalId)
  }, [id])

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading student details...
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>
          Assigned student not found.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate('/donor/students')
          }
          className="btn-primary mt-4"
        >
          Back to Assigned Students
        </button>
      </div>
    )
  }

  const extra = parseExtra(
    assignment.extra_data
  )

  const supplementaryDocuments =
    Array.isArray(
      assignment.supplementary_documents
    )
      ? assignment.supplementary_documents
          .map(value =>
            String(value).trim()
          )
          .filter(Boolean)
      : []

  const requiredDocuments = [
    ...COMMON_REQUIRED_DOCS,
    ...supplementaryDocuments,
  ]

  const verifiedDocuments =
    requiredDocuments.filter(
      documentName =>
        documents.some(
          document =>
            document.document_name ===
              documentName &&
            document.status ===
              'Verified'
        )
    ).length

  const submittedDocuments =
    requiredDocuments.filter(
      documentName =>
        documents.some(
          document =>
            document.document_name ===
              documentName &&
            document.status ===
              'Submitted'
        )
    ).length

  const missingDocuments =
    requiredDocuments.filter(
      documentName =>
        !documents.some(
          document =>
            document.document_name ===
            documentName
        )
    ).length

  const documentScore =
    requiredDocuments.length > 0
      ? Math.round(
          (verifiedDocuments /
            requiredDocuments.length) *
            100
        )
      : 0

  const scholarshipPaymentStatus =
    assignment.payment_status ||
    'Pending'

  const paymentNeedsAttention =
    scholarshipPaymentStatus !== 'Paid'

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumb
        items={[
          {
            label: 'Assigned Students',
            href: '/donor/students',
          },
          {
            label: 'Student Details',
          },
        ]}
      />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-purple-600 font-semibold mb-1">
            Scholarship:{' '}
            {assignment.scholarship_title ||
              'Unknown'}
          </p>

          <h1 className="page-title">
            {assignment.student_name}
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Reg. No.{' '}
            {assignment.registration_number ||
              '—'}{' '}
            · Batch{' '}
            {assignment.batch || '—'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge-green inline-flex items-center gap-1">
            <ShieldCheck size={11} />
            Admin Verified
          </span>

          <ScholarshipPaymentBadge
            status={
              scholarshipPaymentStatus
            }
          />

          <button
            type="button"
            onClick={() =>
              navigate('/donor/students')
            }
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck
          size={18}
          className="text-blue-600 flex-shrink-0 mt-0.5"
        />

        <div>
          <p className="font-semibold text-blue-800 text-sm">
            Student selection is complete
          </p>

          <p className="text-xs text-blue-700 mt-0.5">
            The admin already reviewed the
            application, verified all required
            documents and verified the student's
            bank details. Donor approval is not
            required.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Batch',
            value: assignment.batch,
            icon: Calendar,
            color:
              'bg-purple-50 text-purple-600',
          },
          {
            label: 'Department',
            value:
              assignment.department,
            icon: Building,
            color:
              'bg-blue-50 text-blue-600',
          },
          {
            label: 'GPA',
            value: assignment.gpa
              ? `${Number(
                  assignment.gpa
                ).toFixed(2)} / 4.00`
              : '—',
            icon: Star,
            color:
              'bg-amber-50 text-amber-600',
          },
          {
            label: 'Docs Verified',
            value: `${verifiedDocuments} / ${requiredDocuments.length}`,
            icon: FileText,
            color:
              'bg-green-50 text-green-600',
          },
        ].map(
          ({
            label,
            value,
            icon: Icon,
            color,
          }) => (
            <div
              key={label}
              className="card p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
              >
                <Icon size={16} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  {label}
                </p>

                <p className="text-sm font-bold text-slate-800 truncate">
                  {value || '—'}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      <Section
        title="Personal Information"
        icon={User}
        color="purple"
      >
        <InfoGrid>
          <InfoItem
            label="Full Name"
            value={
              assignment.student_name
            }
            icon={User}
          />

          <InfoItem
            label="Registration Number"
            value={
              assignment.registration_number
            }
            icon={Hash}
            mono
          />

          <InfoItem
            label="NIC Number"
            value={extra.nic_number}
            icon={CreditCard}
            mono
          />

          <InfoItem
            label="Mobile Number"
            value={assignment.phone}
            icon={Phone}
          />

          <InfoItem
            label="Email Address"
            value={assignment.email}
            icon={Mail}
          />

          <InfoItem
            label="Batch"
            value={assignment.batch}
            icon={Calendar}
          />

          <InfoItem
            label="District"
            value={extra.district}
            icon={MapPin}
          />

          <InfoItem
            label="Department"
            value={assignment.department}
            icon={Building}
          />

          <InfoItem
            label="Postal Address"
            value={extra.postal_address}
            icon={Home}
            fullWidth
          />
        </InfoGrid>
      </Section>

      <Section
        title="Family Details"
        icon={Users}
        color="blue"
        collapsible
        defaultOpen
        badge={`${
          (extra.school_siblings
            ?.length || 0) +
          (extra.uni_siblings
            ?.length || 0)
        } siblings`}
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <GraduationCap size={13} />
              School-going Brothers /
              Sisters
            </p>

            <SchoolSiblingTable
              siblings={
                extra.school_siblings ||
                []
              }
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BookOpen size={13} />
              Brothers / Sisters in
              University or Higher
              Education
            </p>

            <UniSiblingTable
              siblings={
                extra.uni_siblings ||
                []
              }
            />
          </div>
        </div>
      </Section>

      <Section
        title="Financial Details"
        icon={DollarSign}
        color="amber"
        collapsible
        defaultOpen
      >
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Father / Guardian
              </p>

              <InfoGrid>
                <InfoItem
                  label="Name"
                  value={extra.father_name}
                />

                <InfoItem
                  label="Occupation"
                  value={
                    extra.father_occupation
                  }
                  icon={Briefcase}
                />

                <InfoItem
                  label="Monthly Income"
                  value={
                    extra.father_income
                      ? `LKR ${Number(
                          extra.father_income
                        ).toLocaleString()}`
                      : null
                  }
                  icon={DollarSign}
                />

                <InfoItem
                  label="Employer"
                  value={
                    extra.father_employer
                  }
                />

                <InfoItem
                  label="Contact"
                  value={
                    extra.father_contact
                  }
                  icon={Phone}
                />
              </InfoGrid>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Mother / Guardian
              </p>

              <InfoGrid>
                <InfoItem
                  label="Name"
                  value={extra.mother_name}
                />

                <InfoItem
                  label="Occupation"
                  value={
                    extra.mother_occupation
                  }
                  icon={Briefcase}
                />

                <InfoItem
                  label="Monthly Income"
                  value={
                    extra.mother_income
                      ? `LKR ${Number(
                          extra.mother_income
                        ).toLocaleString()}`
                      : null
                  }
                  icon={DollarSign}
                />

                <InfoItem
                  label="Employer"
                  value={
                    extra.mother_employer
                  }
                />

                <InfoItem
                  label="Contact"
                  value={
                    extra.mother_contact
                  }
                  icon={Phone}
                />
              </InfoGrid>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
              Family Income Summary
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                {
                  label:
                    'Total Monthly Income',
                  value:
                    assignment.monthly_income
                      ? `LKR ${Number(
                          assignment.monthly_income
                        ).toLocaleString()}`
                      : '—',
                  color:
                    'bg-purple-50 text-purple-700',
                },
                {
                  label:
                    'Family Members',
                  value:
                    extra.num_family_members ||
                    '—',
                  color:
                    'bg-blue-50 text-blue-700',
                },
                {
                  label: 'Dependents',
                  value:
                    assignment.num_dependents ||
                    '—',
                  color:
                    'bg-amber-50 text-amber-700',
                },
                {
                  label:
                    'School Children',
                  value:
                    extra.school_children_count ||
                    '—',
                  color:
                    'bg-green-50 text-green-700',
                },
              ].map(
                ({
                  label,
                  value,
                  color,
                }) => (
                  <div
                    key={label}
                    className={`rounded-xl p-3 text-center ${color}`}
                  >
                    <p className="text-xs font-medium opacity-70">
                      {label}
                    </p>

                    <p className="text-base font-bold mt-0.5">
                      {value}
                    </p>
                  </div>
                )
              )}
            </div>

            <NeedIndicator
              income={Number.parseFloat(
                assignment.monthly_income
              )}
              dependents={Number.parseInt(
                assignment.num_dependents,
                10
              )}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Academic Details"
        icon={GraduationCap}
        color="green"
      >
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          {[
            {
              label: 'Current Year',
              value:
                assignment.current_year ||
                extra.current_year,
            },
            {
              label: 'Semester',
              value: extra.semester,
            },
            {
              label: 'Department',
              value:
                assignment.department,
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-slate-50 rounded-xl p-4 text-center"
            >
              <p className="text-xs text-slate-500 font-medium">
                {label}
              </p>

              <p className="text-base font-bold text-slate-800 mt-1">
                {value || '—'}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-slate-500 mb-1">
          GPA / CGPA
        </p>

        <GPABar
          gpa={assignment.gpa}
        />
      </Section>

      <Section
        title="Required Documents"
        icon={FileText}
        color="slate"
      >
        <div className="flex flex-wrap items-center gap-4 mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="badge-green">
              {verifiedDocuments} Verified
            </span>

            <span className="badge-blue">
              {submittedDocuments} Submitted
            </span>

            {missingDocuments > 0 && (
              <span className="badge-red">
                {missingDocuments} Missing
              </span>
            )}
          </div>

          <div className="flex-1 min-w-[140px]">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{
                  width: `${documentScore}%`,
                }}
              />
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {documentScore}% verified
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-700 mb-4 flex items-start gap-2">
          <Info
            size={13}
            className="mt-0.5 flex-shrink-0"
          />

          Documents are read-only for
          donors. The admin has already
          verified the required files.
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {[
                  '',
                  'Document',
                  'Uploaded',
                  'Status',
                  'Actions',
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
              {requiredDocuments.map(
                documentName => (
                  <DocRow
                    key={documentName}
                    name={documentName}
                    doc={documents.find(
                      document =>
                        document.document_name ===
                        documentName
                    )}
                  />
                )
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Admin-Verified Bank Details"
        icon={CreditCard}
        color="green"
        badge={
          assignment.payment_details_status
        }
      >
        <div className="space-y-5">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle
              size={18}
              className="text-green-600 flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="font-semibold text-green-700 text-sm">
                Bank details verified by
                admin
              </p>

              <p className="text-xs text-green-600 mt-0.5">
                These details are ready to
                use for scholarship payment
                processing.
              </p>
            </div>
          </div>

          <InfoGrid>
            <InfoItem
              label="Account Holder Name"
              value={
                assignment.account_holder_name
              }
              icon={User}
            />

            <InfoItem
              label="Bank Name"
              value={
                assignment.bank_name
              }
              icon={Building}
            />

            <InfoItem
              label="Branch Name"
              value={
                assignment.branch_name
              }
              icon={Building}
            />

            <InfoItem
              label="Account Number"
              value={maskAccountNumber(
                assignment.account_number
              )}
              icon={Hash}
              mono
            />

            <InfoItem
              label="Account Type"
              value={
                assignment.account_type
              }
              icon={CreditCard}
            />

            <InfoItem
              label="Contact Number"
              value={
                assignment.contact_number
              }
              icon={Phone}
            />

            <InfoItem
              label="Verified By"
              value={
                assignment.verified_by_name
              }
              icon={ShieldCheck}
              highlight="green"
            />

            <InfoItem
              label="Verified Date"
              value={
                assignment.payment_verified_date
                  ? format(
                      new Date(
                        assignment.payment_verified_date
                      ),
                      'MMM d, yyyy · h:mm a'
                    )
                  : null
              }
              icon={Calendar}
              highlight="green"
            />
          </InfoGrid>

          {assignment.passbook_url && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Bank Passbook / Account
                Proof
              </p>

              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <FileText
                  size={15}
                  className="text-purple-600 flex-shrink-0"
                />

                <p className="text-xs text-slate-700 font-medium flex-1 truncate">
                  {assignment.passbook_file_name ||
                    'Bank account proof'}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    viewDocument(
                      assignment.passbook_url
                    )
                  }
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  <Eye size={12} />
                  View
                </button>

                <a
                  href={
                    assignment.passbook_url
                  }
                  download={
                    assignment.passbook_file_name
                  }
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  <Download size={12} />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Scholarship Payment"
        icon={CreditCard}
        color={
          scholarshipPaymentStatus ===
          'Paid'
            ? 'green'
            : scholarshipPaymentStatus ===
              'Failed'
            ? 'red'
            : scholarshipPaymentStatus ===
              'On Hold'
            ? 'amber'
            : 'purple'
        }
        badge={
          scholarshipPaymentStatus
        }
      >
        <div className="space-y-5">
          <InfoGrid>
            <InfoItem
              label="Payment Status"
              value={
                scholarshipPaymentStatus
              }
              icon={Clock}
              highlight={
                scholarshipPaymentStatus ===
                'Paid'
                  ? 'green'
                  : scholarshipPaymentStatus ===
                    'Failed'
                  ? 'red'
                  : scholarshipPaymentStatus ===
                    'On Hold'
                  ? 'amber'
                  : 'blue'
              }
            />

            <InfoItem
              label="Paid Amount"
              value={
                assignment.paid_amount
                  ? `LKR ${Number(
                      assignment.paid_amount
                    ).toLocaleString()}`
                  : null
              }
              icon={DollarSign}
            />

            <InfoItem
              label="Payment Date"
              value={
                assignment.payment_date
                  ? format(
                      new Date(
                        assignment.payment_date
                      ),
                      'MMM d, yyyy · h:mm a'
                    )
                  : null
              }
              icon={Calendar}
            />

            <InfoItem
              label="Transaction Reference"
              value={
                assignment.transaction_reference
              }
              icon={Hash}
              mono
            />
          </InfoGrid>

          {assignment.receipt_url && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Payment Receipt
              </p>

              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <FileText
                  size={15}
                  className="text-green-600"
                />

                <p className="text-xs text-slate-700 font-medium flex-1 truncate">
                  {assignment.receipt_file_name ||
                    'Payment receipt'}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    viewDocument(
                      assignment.receipt_url
                    )
                  }
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  <Eye size={12} />
                  View
                </button>
              </div>
            </div>
          )}

          {paymentNeedsAttention ? (
            <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Payment action required
                </p>

                <p className="text-xs text-slate-500 mt-0.5">
                  Use the existing Payments
                  page to process and record
                  this scholarship payment.
                </p>
              </div>

              <Link
                to="/donor/payments"
                className="btn-primary flex items-center gap-2"
              >
                <CreditCard size={15} />
                Process Payment
              </Link>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle
                size={18}
                className="text-green-600"
              />

              <div>
                <p className="text-sm font-semibold text-green-700">
                  Scholarship payment
                  completed
                </p>

                <p className="text-xs text-green-600 mt-0.5">
                  This payment was recorded
                  successfully.
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Workflow Timeline"
        icon={Clock}
        color="slate"
        collapsible
        defaultOpen={false}
      >
        <div className="space-y-3">
          {[
            {
              label:
                'Application Submitted',
              date:
                assignment.created_at,
              color:
                'bg-purple-500',
            },
            {
              label:
                'Payment Details Verified by Admin',
              date:
                assignment.payment_verified_date,
              color:
                'bg-green-500',
            },
            {
              label:
                'Assigned to Donor',
              date:
                assignment.assigned_at,
              color:
                'bg-blue-500',
            },
            {
              label: `Payment Status: ${scholarshipPaymentStatus}`,
              date:
                assignment.payment_date ||
                assignment.updated_at,
              color:
                scholarshipPaymentStatus ===
                'Paid'
                  ? 'bg-green-500'
                  : scholarshipPaymentStatus ===
                    'Failed'
                  ? 'bg-red-500'
                  : scholarshipPaymentStatus ===
                    'On Hold'
                  ? 'bg-amber-500'
                  : 'bg-blue-400',
            },
          ]
            .filter(item => item.date)
            .map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}
                />

                <div className="flex items-center justify-between flex-1 gap-4">
                  <span className="text-sm text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-xs text-slate-400">
                    {format(
                      new Date(item.date),
                      'MMM d, yyyy · h:mm a'
                    )}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </Section>

      <div className="card p-5 border-l-4 border-green-500 bg-green-50/50">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="text-green-600 flex-shrink-0 mt-0.5"
          />

          <div>
            <p className="font-semibold text-slate-800">
              No donor approval is required
            </p>

            <p className="text-sm text-slate-600 mt-1">
              This student was selected and
              verified by the admin. Your next
              responsibility is to process the
              scholarship payment using the
              Payments page.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh Details'}
          </button>

          {paymentNeedsAttention && (
            <Link
              to="/donor/payments"
              className="btn-primary flex items-center gap-2"
            >
              <CreditCard size={15} />
              Open Payments
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}