import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { Breadcrumb } from '../../components/common/Breadcrumb'
import api from '../../services/api'

export default function AssignStudentsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [scholarship, setScholarship] =
    useState(null)

  const [students, setStudents] =
    useState([])

  const [assignedStudents, setAssignedStudents] =
    useState([])

  const [selected, setSelected] =
    useState([])

  const [search, setSearch] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [assigning, setAssigning] =
    useState(false)

  const load = async () => {
    setLoading(true)

    try {
      const [
        scholarshipResponse,
        studentsResponse,
        assignedResponse,
      ] = await Promise.all([
        api.get(`/scholarships/${id}`),

        api
          .get(
            `/scholarships/${id}/approved-students`
          )
          .catch(() => ({ data: [] })),

        api
          .get(
            `/scholarships/${id}/final-students`
          )
          .catch(() => ({ data: [] })),
      ])

      setScholarship(
        scholarshipResponse.data
      )

      setStudents(
        studentsResponse.data
      )

      setAssignedStudents(
        assignedResponse.data
      )
    } catch (error) {
      console.error(
        'Load assignment page error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to load assignment information'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const availableStudents =
    useMemo(
      () =>
        students.filter(
          student =>
            student.assignment_status !==
            'Assigned'
        ),
      [students]
    )

  const filteredStudents =
    useMemo(() => {
      const term =
        search.trim().toLowerCase()

      if (!term) {
        return students
      }

      return students.filter(student =>
        [
          student.student_name,
          student.registration_number,
          student.batch,
          student.department,
        ]
          .filter(Boolean)
          .some(value =>
            String(value)
              .toLowerCase()
              .includes(term)
          )
      )
    }, [students, search])

  const selectableFilteredStudents =
    filteredStudents.filter(
      student =>
        student.assignment_status !==
        'Assigned'
    )

  const allVisibleSelected =
    selectableFilteredStudents.length > 0 &&
    selectableFilteredStudents.every(student =>
      selected.includes(student.student_id)
    )

  const toggleStudent = studentId => {
    setSelected(current =>
      current.includes(studentId)
        ? current.filter(
            idValue =>
              idValue !== studentId
          )
        : [...current, studentId]
    )
  }

  const toggleAllVisible = checked => {
    if (!checked) {
      const visibleIds =
        selectableFilteredStudents.map(
          student => student.student_id
        )

      setSelected(current =>
        current.filter(
          studentId =>
            !visibleIds.includes(studentId)
        )
      )

      return
    }

    const visibleIds =
      selectableFilteredStudents.map(
        student => student.student_id
      )

    setSelected(current =>
      Array.from(
        new Set([
          ...current,
          ...visibleIds,
        ])
      )
    )
  }

  const handleAssign = async () => {
    if (!selected.length) {
      toast.error(
        'Select at least one student'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Assign ${selected.length} selected student(s) to ${scholarship?.donor_name || 'the scholarship donor'}?`
      )

    if (!confirmed) {
      return
    }

    setAssigning(true)

    try {
      const response =
        await api.post(
          `/scholarships/${id}/assign`,
          {
            student_ids: selected,
          }
        )

      const assignedCount =
        response.data?.assigned_count ??
        selected.length

      const skippedCount =
        response.data?.skipped_count ?? 0

      toast.success(
        `${assignedCount} student(s) assigned successfully`
      )

      if (skippedCount > 0) {
        toast.error(
          `${skippedCount} student(s) were skipped`
        )
      }

      setSelected([])
      await load()
    } catch (error) {
      console.error(
        'Assign students error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to assign students'
      )
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading assignment information...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          {
            label: 'Scholarships',
            href: '/scholarships',
          },
          {
            label:
              'Payment-Verified Students',
          },
          {
            label: 'Assign to Donor',
          },
        ]}
      />

      <div>
        <h1 className="page-title">
          Assign Students to Donor
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Only students whose applications and
          payment details were verified by the
          admin can be assigned.
        </p>
      </div>

      {scholarship && (
        <div className="card p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            {[
              [
                'Scholarship',
                scholarship.title,
              ],
              [
                'Donor',
                scholarship.donor_name ||
                  'Not assigned',
              ],
              [
                'Funding Amount',
                scholarship.funding_amount
                  ? `LKR ${Number(
                      scholarship.funding_amount
                    ).toLocaleString()}`
                  : '—',
              ],
              [
                'Ready to Assign',
                availableStudents.length,
              ],
              [
                'Already Assigned',
                assignedStudents.length,
              ],
              [
                'Eligible Batch',
                scholarship.eligible_batch ||
                  '—',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-slate-500 font-medium">
                  {label}
                </p>

                <p className="font-semibold text-slate-800 mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!scholarship?.donor_id && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle
            size={16}
            className="mt-0.5 flex-shrink-0"
          />

          <div>
            <p className="font-semibold">
              Scholarship donor is missing
            </p>

            <p className="text-xs mt-1">
              Assign a donor to this scholarship
              before assigning students.
            </p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck
              size={17}
              className="text-green-600"
            />

            <h2 className="font-semibold text-slate-700">
              Payment-Verified Students
            </h2>

            <span className="badge-green">
              {students.length}
            </span>

            <span className="text-xs text-slate-500">
              {selected.length} selected
            </span>
          </div>

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
              placeholder="Search students..."
              className="input-field pl-8 text-xs h-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={event =>
                      toggleAllVisible(
                        event.target.checked
                      )
                    }
                    disabled={
                      !selectableFilteredStudents.length
                    }
                    className="rounded border-slate-300 text-purple-600"
                  />
                </th>

                {[
                  'Student',
                  'Registration',
                  'Batch',
                  'GPA',
                  'Department',
                  'Payment Verification',
                  'Assignment',
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
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No payment-verified students
                    found for this scholarship.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const alreadyAssigned =
                    student.assignment_status ===
                    'Assigned'

                  return (
                    <tr
                      key={
                        student.application_id
                      }
                      onClick={() => {
                        if (!alreadyAssigned) {
                          toggleStudent(
                            student.student_id
                          )
                        }
                      }}
                      className={`transition-colors ${
                        alreadyAssigned
                          ? 'opacity-60'
                          : 'cursor-pointer hover:bg-slate-50/60'
                      } ${
                        selected.includes(
                          student.student_id
                        )
                          ? 'bg-purple-50/40'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(
                            student.student_id
                          )}
                          readOnly
                          disabled={alreadyAssigned}
                          className="rounded border-slate-300 text-purple-600"
                        />
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {student.student_name}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {
                          student.registration_number
                        }
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {student.batch || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            Number(student.gpa) >=
                            3.5
                              ? 'text-green-600 font-semibold'
                              : 'text-slate-600'
                          }
                        >
                          {student.gpa || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {student.department ||
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        <span className="badge-green">
                          Admin Verified
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {alreadyAssigned ? (
                          <span className="badge-purple">
                            Assigned
                          </span>
                        ) : (
                          <span className="badge-grey">
                            Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {selected.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Users
                size={18}
                className="text-purple-600"
              />

              <div>
                <p className="text-xs text-slate-500">
                  Selected Students
                </p>

                <p className="text-2xl font-bold text-slate-800">
                  {selected.length}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAssign}
                disabled={
                  assigning ||
                  !scholarship?.donor_id
                }
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {assigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Assign Selected Students
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelected([])
                }
                disabled={assigning}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <CheckCircle
            size={17}
            className="text-green-600"
          />

          <h2 className="font-semibold text-slate-700">
            Assigned Students
          </h2>

          <span className="badge-green">
            {assignedStudents.length}
          </span>

          <button
            type="button"
            onClick={load}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {[
                  'Student',
                  'Registration',
                  'Donor',
                  'Assigned Date',
                  'Application Status',
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
              {assignedStudents.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No students have been assigned
                    yet.
                  </td>
                </tr>
              ) : (
                assignedStudents.map(student => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {student.student_name}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {
                        student.registration_number
                      }
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {student.donor_name || '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {student.assigned_at
                        ? new Date(
                            student.assigned_at
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <span className="badge-purple">
                        {student.application_status ||
                          'Assigned to Donor'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="badge-green">
                        {
                          student.payment_details_status
                        }
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/applications/${student.application_id}`
                          )
                        }
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                      >
                        <Eye size={13} />
                        View Application
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        The admin has already approved the student
        and verified the bank information. The donor
        does not approve the student again. The donor
        will use the Payments page to process and
        record the scholarship payment.
      </div>
    </div>
  )
}