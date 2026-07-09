import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Trash2, Upload, Eye, Download, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Step6PaymentDetails from '../../components/student/Step6PaymentDetails'
import api from '../../services/api'

// ─── Constants ───────────────────────────────────────────────
const STEPS = ['Personal Info', 'Family Details', 'Financial Details', 'Academic Details', 'Documents', 'Payment Details']

const SRI_LANKA_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'
]

const UNIVERSITY_LIST = [
  'University of Peradeniya','University of Colombo','University of Moratuwa',
  'University of Kelaniya','University of Sri Jayewardenepura','University of Ruhuna',
  'University of Jaffna','University of Sabaragamuwa','Eastern University',
  'South Eastern University','Rajarata University','Wayamba University',
  'Uva Wellassa University','Weeramantri Institute','Other'
]

const REQUIRED_DOCS = [
  { key: 'nic', label: 'NIC Copy' },
  { key: 'transcript', label: 'Academic Transcript' },
  { key: 'income', label: 'Income Certificate' },
  { key: 'recommendation', label: 'Recommendation Letter' },
]

const STUDY_YEARS = ['1st Year','2nd Year','3rd Year','4th Year','Final Year']
const SEMESTERS  = ['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8']

// ─── Helpers ─────────────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob) return ''
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

const validateMobile = (value) => {
  if (!value) return 'Mobile Number is required.'
  if (!/^\d+$/.test(value)) return 'Only numeric characters are allowed.'
  if (!value.startsWith('07')) return 'Mobile Number must start with 07.'
  if (value.length !== 10) return 'Mobile Number must contain exactly 10 digits.'
  return ''
}

const validateEmail = (value) => {
  if (!value) return 'Email Address is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.'
  return ''
}

const validateRegNo = (value) => {
  if (!value) return 'Registration Number is required.'
  if (value[0] !== 'E') return "The first character must be uppercase 'E'."
  if (!/^E\d{5}$/.test(value)) return 'Registration Number must follow the format EYYXXX (Example: E21001).'
  return ''
}

const validateContactNumber = (value) => {
  if (!value) return 'Contact Number is required.'
  if (!/^\d+$/.test(value)) return 'Only numeric characters are allowed.'
  if (!value.startsWith('07')) return 'Contact Number must start with 07.'
  if (value.length !== 10) return 'Contact Number must contain exactly 10 digits.'
  return ''
}

const preventInvalidNumberInput = (e) => {
  if (['e', 'E', '-', '+'].includes(e.key)) {
    e.preventDefault()
  }
}

const emptySchoolSibling = () => ({ name: '', dob: '', school: '' })
const emptyUniSibling    = () => ({ name: '', university: '', course: '', al_year: '', mahapola: '' })

// ─── Step Indicator ──────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-8 overflow-x-auto pb-2">
      {STEPS.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center min-w-[64px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done ? 'bg-green-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {done ? <Check size={14}/> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px] hidden sm:block
                ${active ? 'text-purple-600 font-semibold' : done ? 'text-green-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mb-4 mx-1 flex-shrink-0 transition-colors ${done ? 'bg-green-400' : 'bg-slate-200'}`}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Field wrapper ───────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{error}</p>}
    </div>
  )
}

// ─── Section Header ──────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="pb-3 mb-4 border-b border-purple-100">
      <h3 className="font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 1 — Personal Information
// ═══════════════════════════════════════════════════════════════
function Step1Personal({ data, onChange, errors, mobileTouched, emailTouched, regNoTouched }) {
  const getRegNoClass = () => {
    const val = data.registration_number || ''
    if (!val && !regNoTouched) return 'input-field'
    const err = validateRegNo(val)
    return err
      ? 'input-field border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'input-field border-green-500 focus:border-green-500 focus:ring-green-100'
  }

  const getMobileClass = () => {
    const val = data.mobile || ''
    if (!val && !mobileTouched) return 'input-field'
    const err = validateMobile(val)
    return err
      ? 'input-field border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'input-field border-green-500 focus:border-green-500 focus:ring-green-100'
  }

  const getEmailClass = () => {
    const val = data.email || ''
    if (!val && !emailTouched) return 'input-field'
    const err = validateEmail(val)
    return err
      ? 'input-field border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'input-field border-green-500 focus:border-green-500 focus:ring-green-100'
  }

  const f = (field) => ({
    value: data[field] || '',
    onChange: e => onChange(field, e.target.value),
    className: `input-field ${errors[field] ? 'border-red-300' : ''}`
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Personal Information" subtitle="Provide your personal details as per official records." />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label="Full Name" required error={errors.full_name}>
            <input type="text" placeholder="Enter full name" {...f('full_name')} />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Postal Address" required error={errors.postal_address}>
            <textarea rows={3} placeholder="Enter your postal address"
              value={data.postal_address || ''} onChange={e => onChange('postal_address', e.target.value)}
              className={`input-field resize-none ${errors.postal_address ? 'border-red-300' : ''}`} />
          </Field>
        </div>

        <Field label="District" required error={errors.district}>
          <select {...f('district')}>
            <option value="">Select district...</option>
            {SRI_LANKA_DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>

        <Field label="NIC Number" required error={errors.nic_number}>
          <input type="text" placeholder="e.g. 200012345678 or 001234567V" {...f('nic_number')} />
        </Field>

        <Field label="Registration Number" required error={errors.registration_number}>
          <input
            id="registration_number"
            type="text"
            placeholder="e.g. E21001"
            value={data.registration_number || ''}
            onChange={e => onChange('registration_number', e.target.value)}
            className={getRegNoClass()}
          />
        </Field>

        <Field label="Mobile Number" required error={errors.mobile}>
          <input
            id="mobile"
            type="tel"
            placeholder="e.g. 0771234567"
            value={data.mobile || ''}
            onChange={e => onChange('mobile', e.target.value)}
            className={getMobileClass()}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Email Address" required error={errors.email}>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={data.email || ''}
              onChange={e => onChange('email', e.target.value)}
              className={getEmailClass()}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 2 — Family Details
// ═══════════════════════════════════════════════════════════════
function Step2Family({ data, onChange }) {
  const schoolSiblings = data.school_siblings || []
  const uniSiblings    = data.uni_siblings    || []

  const updateSchool = (i, field, value) => {
    const updated = schoolSiblings.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    onChange('school_siblings', updated)
  }
  const addSchool    = () => onChange('school_siblings', [...schoolSiblings, emptySchoolSibling()])
  const removeSchool = (i) => onChange('school_siblings', schoolSiblings.filter((_, idx) => idx !== i))

  const updateUni    = (i, field, value) => {
    const updated = uniSiblings.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    onChange('uni_siblings', updated)
  }
  const addUni    = () => onChange('uni_siblings', [...uniSiblings, emptyUniSibling()])
  const removeUni = (i) => onChange('uni_siblings', uniSiblings.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-8">
      {/* School Siblings */}
      <div>
        <SectionHeader
          title="A. School-going Brothers / Sisters"
          subtitle="List siblings aged 19 or below who are currently attending school." />

        {schoolSiblings.length === 0 && (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm mb-4">
            No school-going siblings added yet.
          </div>
        )}

        <div className="space-y-4">
          {schoolSiblings.map((s, i) => {
            const age = calcAge(s.dob)
            const ageError = s.dob && age > 19 ? 'Age must be 19 or below' : ''
            return (
              <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sibling {i + 1}</p>
                  <button onClick={() => removeSchool(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                    <Trash2 size={14}/>
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Full Name">
                    <input type="text" placeholder="Name" value={s.name}
                      onChange={e => updateSchool(i, 'name', e.target.value)} className="input-field" />
                  </Field>

                  <Field label="Date of Birth" error={ageError}>
                    <input type="date" value={s.dob}
                      onChange={e => updateSchool(i, 'dob', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={`input-field ${ageError ? 'border-red-300' : ''}`} />
                  </Field>

                  <Field label="Age (Auto-calculated)">
                    <div className={`input-field bg-slate-100 flex items-center font-semibold
                      ${ageError ? 'text-red-500' : 'text-slate-700'}`}>
                      {s.dob ? `${age} years` : '—'}
                    </div>
                  </Field>

                  <Field label="School Name">
                    <input type="text" placeholder="School name" value={s.school}
                      onChange={e => updateSchool(i, 'school', e.target.value)} className="input-field" />
                  </Field>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={addSchool}
          className="mt-3 flex items-center gap-2 text-sm text-purple-600 font-medium hover:text-purple-800 transition-colors">
          <Plus size={15}/> Add School-going Sibling
        </button>
      </div>

      {/* University Siblings */}
      <div>
        <SectionHeader
          title="B. Brothers / Sisters in University or Higher Education"
          subtitle="List siblings currently enrolled in university or higher education." />

        {uniSiblings.length === 0 && (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm mb-4">
            No university siblings added yet.
          </div>
        )}

        <div className="space-y-4">
          {uniSiblings.map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sibling {i + 1}</p>
                <button onClick={() => removeUni(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                  <Trash2 size={14}/>
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full Name">
                  <input type="text" placeholder="Name" value={s.name}
                    onChange={e => updateUni(i,'name',e.target.value)} className="input-field" />
                </Field>

                <Field label="University / Institute">
                  <select value={s.university} onChange={e => updateUni(i,'university',e.target.value)} className="input-field">
                    <option value="">Select...</option>
                    {UNIVERSITY_LIST.map(u => <option key={u}>{u}</option>)}
                  </select>
                </Field>

                <Field label="Course of Study">
                  <input type="text" placeholder="e.g. BSc Engineering" value={s.course}
                    onChange={e => updateUni(i,'course',e.target.value)} className="input-field" />
                </Field>

                <Field label="A/L Year">
                  <input type="number" placeholder="e.g. 2022" value={s.al_year}
                    onChange={e => updateUni(i,'al_year',e.target.value)} className="input-field" />
                </Field>


                <Field label="Receiving Mahapola / Bursary?">
                  <div className="flex gap-4 mt-1">
                    {['Yes','No'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`mahapola_${i}`} value={opt}
                          checked={s.mahapola === opt}
                          onChange={() => updateUni(i,'mahapola',opt)}
                          className="text-purple-600" />
                        <span className="text-sm text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          ))}
        </div>

        <button onClick={addUni}
          className="mt-3 flex items-center gap-2 text-sm text-purple-600 font-medium hover:text-purple-800 transition-colors">
          <Plus size={15}/> Add University Sibling
        </button>
      </div>
    </div>
  )
}

// ─── Guardian Section (hoisted to top level so it isn't recreated on every keystroke) ───
function GuardianSection({ prefix, title, placeholder, data, onChange, errors, contactTouched }) {
  const getContactClass = () => {
    const val = data[`${prefix}_contact`] || ''
    if (!val && !contactTouched) return 'input-field'
    const err = validateContactNumber(val)
    return err
      ? 'input-field border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'input-field border-green-500 focus:border-green-500 focus:ring-green-100'
  }

  const f = (field) => ({
    value: data[field] || '',
    onChange: e => onChange(field, e.target.value),
    className: `input-field ${errors[field] ? 'border-red-300' : ''}`
  })
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-purple-700">{title}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name">
          <input type="text" placeholder={`${title} name`} {...f(`${prefix}_name`)} />
        </Field>
        <Field label="Occupation">
          <input type="text" placeholder="Occupation" {...f(`${prefix}_occupation`)} />
        </Field>
        <Field label="Monthly Income (LKR)" error={errors[`${prefix}_income`]}>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 text-sm font-medium">LKR</span>
            </div>
            <input
              type="number"
              min="0"
              placeholder={placeholder}
              {...f(`${prefix}_income`)}
              className={`${f(`${prefix}_income`).className} pl-12`}
              onKeyDown={preventInvalidNumberInput}
            />
          </div>
        </Field>
        <Field label="Employer Name">
          <input type="text" placeholder="Employer / Company" {...f(`${prefix}_employer`)} />
        </Field>
        <Field label="Contact Number" required error={errors[`${prefix}_contact`]}>
          <input
            id={`${prefix}_contact`}
            type="tel"
            placeholder="0771234567"
            value={data[`${prefix}_contact`] || ''}
            onChange={e => onChange(`${prefix}_contact`, e.target.value)}
            className={getContactClass()}
          />
        </Field>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 3 — Financial Details
// ═══════════════════════════════════════════════════════════════
function Step3Financial({ data, onChange, errors, fatherContactTouched, motherContactTouched }) {
  const f = (field) => ({
    value: data[field] || '',
    onChange: e => onChange(field, e.target.value),
    className: `input-field ${errors[field] ? 'border-red-300' : ''}`
  })

  return (
    <div className="space-y-8">
      {/* Parent/Guardian */}
      <div>
        <SectionHeader title="A. Parent / Guardian Information" />
        <div className="space-y-6">
          <GuardianSection prefix="father" title="Father / Guardian" placeholder="50000" data={data} onChange={onChange} errors={errors} contactTouched={fatherContactTouched} />
          <div className="border-t border-slate-100 pt-6">
            <GuardianSection prefix="mother" title="Mother / Guardian" placeholder="75000" data={data} onChange={onChange} errors={errors} contactTouched={motherContactTouched} />
          </div>
        </div>
      </div>

      {/* Family Income */}
      <div>
        <SectionHeader title="B. Family Income Details" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Total Monthly Family Income (LKR)" error={errors.total_family_income}>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-sm font-medium">LKR</span>
              </div>
              <input
                type="number"
                min="0"
                placeholder="100000"
                {...f('total_family_income')}
                className={`${f('total_family_income').className} pl-12`}
                onKeyDown={preventInvalidNumberInput}
              />
            </div>
          </Field>

          <Field label="Number of Family Members">
            <input type="number" min="1" placeholder="e.g. 5" {...f('num_family_members')} />
          </Field>

          <Field label="Number of Dependents" error={errors.num_dependents}>
            <input type="number" min="0" placeholder="e.g. 3" {...f('num_dependents')} />
          </Field>

          <Field label="Number of School-going Children">
            <input type="number" min="0" placeholder="e.g. 2" {...f('school_children_count')} />
          </Field>

          <Field label="Number of University Students">
            <input type="number" min="0" placeholder="e.g. 1" {...f('uni_students_count')} />
          </Field>
        </div>
      </div>

      {/* Other Aid */}
      <div>
        <SectionHeader title="C. Scholarships / Financial Aid Currently Receiving" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { field: 'receiving_mahapola', label: 'Receiving Mahapola?' },
            { field: 'receiving_bursary',  label: 'Receiving Bursary?' },
          ].map(({ field, label }) => (
            <Field key={field} label={label}>
              <div className="flex gap-4 mt-1">
                {['Yes','No'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={field} value={opt}
                      checked={data[field] === opt}
                      onChange={() => onChange(field, opt)}
                      className="text-purple-600" />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            </Field>
          ))}

          <Field label="Other Scholarships">
            <input type="text" placeholder="Scholarship name (if any)" {...f('other_scholarships')} />
          </Field>

          <Field label="Total Other Scholarship Amount (LKR)" error={errors.other_scholarship_amount}>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-sm font-medium">LKR</span>
              </div>
              <input
                type="number"
                min="0"
                placeholder="0"
                {...f('other_scholarship_amount')}
                className={`${f('other_scholarship_amount').className} pl-12`}
                onKeyDown={preventInvalidNumberInput}
              />
            </div>
          </Field>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 4 — Academic Details
// ═══════════════════════════════════════════════════════════════
function Step4Academic({ data, onChange, errors }) {
  const f = (field) => ({
    value: data[field] || '',
    onChange: e => onChange(field, e.target.value),
    className: `input-field ${errors[field] ? 'border-red-300' : ''}`
  })

  const gpa = parseFloat(data.gpa)
  const gpaValid = !data.gpa || (gpa >= 0 && gpa <= 4.0)

  return (
    <div className="space-y-5">
      <SectionHeader title="Academic Details" subtitle="Provide your current academic information." />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Current Year of Study" required error={errors.current_year}>
          <select {...f('current_year')}>
            <option value="">Select year...</option>
            {STUDY_YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
        </Field>

        <Field label="Semester" required error={errors.semester}>
          <select {...f('semester')}>
            <option value="">Select semester...</option>
            {SEMESTERS.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="GPA / CGPA" required error={errors.gpa || (!gpaValid ? 'GPA must be between 0.00 and 4.00' : '')}>
            <input type="number" step="0.01" min="0" max="4.00"
              placeholder="e.g. 3.75"
              value={data.gpa || ''}
              onChange={e => onChange('gpa', e.target.value)}
              className={`input-field ${(!gpaValid || errors.gpa) ? 'border-red-300' : ''}`} />
          </Field>
        </div>
      </div>

      {data.current_year && data.current_year !== '1st Year' && !data.gpa && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          ⚠️ GPA is required for 2nd year and above students.
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STEP 5 — Documents
// ═══════════════════════════════════════════════════════════════
function Step5Documents({ appId, onDocsChange, onNeedSave }) {
  const [docs, setDocs]             = useState({})
  const [serverDocs, setServerDocs] = useState([])
  const [uploading, setUploading]   = useState(null)
  const [previews, setPreviews]     = useState({})
  const fileRefs = useRef({})

  // Load already-uploaded docs whenever appId becomes available
  useEffect(() => {
    if (!appId) return
    api.get(`/applications/${appId}/documents`)
      .then(r => setServerDocs(r.data || []))
      .catch(() => {})
  }, [appId])

  const serverUploadedNames = serverDocs.map(d => d.document_name)

  const handleFile = async (key, file) => {
    if (!file) return
    const allowed = ['application/pdf','image/jpeg','image/png','image/jpg']
    if (!allowed.includes(file.type)) { toast.error('Only PDF, JPG, PNG allowed'); return }
    if (file.size > 5 * 1024 * 1024)  { toast.error('Max 5MB per file'); return }

    // Must have an appId to upload — ask parent to save draft first
    if (!appId) {
      toast('Click "Save Draft" first to create your application, then upload documents.', { icon: '⚠️' })
      if (onNeedSave) onNeedSave()
      return
    }

    // Local preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreviews(p => ({ ...p, [key]: e.target.result }))
      reader.readAsDataURL(file)
    } else {
      setPreviews(p => ({ ...p, [key]: null }))
    }

    setUploading(key)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('document_name', REQUIRED_DOCS.find(d => d.key === key).label)
      await api.post(`/applications/${appId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Document uploaded successfully!')
      // Refresh server doc list so admin/donor can see it immediately
      const r = await api.get(`/applications/${appId}/documents`)
      setServerDocs(r.data || [])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(null)
      if (fileRefs.current[key]) fileRefs.current[key].value = ''
    }

    const updated = { ...docs, [key]: { file, name: file.name, size: file.size } }
    setDocs(updated)
    onDocsChange(updated)
  }

  const removeDoc = (key) => {
    const updated = { ...docs }
    delete updated[key]
    setDocs(updated)
    setPreviews(p => { const n = { ...p }; delete n[key]; return n })
    onDocsChange(updated)
    if (fileRefs.current[key]) fileRefs.current[key].value = ''
  }

  const formatSize = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  // Count both local and server uploads
  const totalUploaded = REQUIRED_DOCS.filter(({ key, label }) =>
    docs[key] || serverUploadedNames.includes(label)
  ).length

  return (
    <div className="space-y-5">
      <SectionHeader title="Required Documents" subtitle="Upload all required documents before submitting." />

      {/* No appId warning */}
      {!appId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-start gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5"/>
          <span>Click <strong>Save Draft</strong> first, then you can upload your documents.</span>
        </div>
      )}

      {/* Progress */}
      <div className="bg-purple-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-purple-700">Upload Progress</span>
          <span className="text-sm font-bold text-purple-700">{totalUploaded} / {REQUIRED_DOCS.length} Uploaded</span>
        </div>
        <div className="w-full h-2.5 bg-purple-200 rounded-full overflow-hidden">
          <div className="h-full bg-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${(totalUploaded / REQUIRED_DOCS.length) * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-purple-500 mt-1">
          <span>Allowed: PDF, JPG, JPEG, PNG</span>
          <span>Max: 5 MB per file</span>
        </div>
      </div>

      {/* Document rows */}
      <div className="space-y-3">
        {REQUIRED_DOCS.map(({ key, label }) => {
          const localDoc  = docs[key]
          const serverDoc = serverDocs.find(d => d.document_name === label)
          const isDone    = !!localDoc || !!serverDoc
          const isUp      = uploading === key

          return (
            <div key={key} className={`rounded-xl border-2 transition-all overflow-hidden
              ${isDone ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-3 p-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isDone ? 'bg-green-100' : 'bg-slate-100'}`}>
                  {isDone ? <Check size={18} className="text-green-600"/> : <FileText size={18} className="text-slate-400"/>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  {serverDoc ? (
                    <p className="text-xs text-green-600 truncate">
                      ✓ {serverDoc.file_name || 'Uploaded'}
                      {serverDoc.file_url && (
                        <button onClick={() => window.open(serverDoc.file_url, '_blank')}
                          className="ml-2 underline text-purple-600 hover:text-purple-800">View</button>
                      )}
                    </p>
                  ) : localDoc ? (
                    <p className="text-xs text-slate-500 truncate">{localDoc.name} · {formatSize(localDoc.size)}</p>
                  ) : (
                    <p className="text-xs text-red-400">Not uploaded</p>
                  )}
                </div>

                {/* Status */}
                {isDone
                  ? <span className="badge-green flex-shrink-0">✓ Uploaded</span>
                  : <span className="badge-red flex-shrink-0">Missing</span>}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {localDoc?.file && localDoc.file.type.startsWith('image/') && previews[key] && (
                    <a href={previews[key]} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                      <Eye size={15}/>
                    </a>
                  )}
                  {localDoc && !serverDoc && (
                    <button onClick={() => removeDoc(key)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 size={15}/>
                    </button>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    ref={el => fileRefs.current[key] = el}
                    onChange={e => handleFile(key, e.target.files[0])} />
                  <button
                    onClick={() => fileRefs.current[key]?.click()}
                    disabled={isUp || !appId}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                      ${isDone ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-purple-600 text-white hover:bg-purple-700'}
                      disabled:opacity-50 disabled:cursor-not-allowed`}>
                    {isUp
                      ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> Uploading</>
                      : <><Upload size={12}/> {isDone ? 'Replace' : 'Upload'}</>}
                  </button>
                </div>
              </div>

              {/* Image preview strip */}
              {previews[key] && (
                <div className="px-4 pb-4">
                  <img src={previews[key]} alt={label}
                    className="h-24 w-auto rounded-lg border border-green-200 object-cover" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalUploaded < REQUIRED_DOCS.length && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          ⚠️ Please upload all {REQUIRED_DOCS.length} required documents before submitting.
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ScholarshipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [scholarship, setScholarship] = useState(null)
  const [applying, setApplying]       = useState(false)
  const [step, setStep]               = useState(0)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [savedAppId, setSavedAppId]   = useState(null)
  const [declared, setDeclared]       = useState(false)
  const [docs, setDocs]               = useState({})
  const [adminApproval, setAdminApproval] = useState(null)
  const [donorApproval, setDonorApproval] = useState(null)

  const [formData, setFormData] = useState({})
  const [errors, setErrors]     = useState({})

  const [mobileTouched, setMobileTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [regNoTouched, setRegNoTouched] = useState(false)
  const [fatherContactTouched, setFatherContactTouched] = useState(false)
  const [motherContactTouched, setMotherContactTouched] = useState(false)

  useEffect(() => {
    api.get(`/scholarships/${id}`)
      .then(r => setScholarship(r.data))
      .catch(() => toast.error('Scholarship not found'))
      .finally(() => setLoading(false))
  }, [id])

  // Load existing application status for Payment Details unlock check
  useEffect(() => {
    api.get('/student/applications')
      .then(r => {
        const existing = r.data.find(a => a.scholarship_id === id)
        if (existing) {
          setSavedAppId(existing.id)
          setAdminApproval(existing.status === 'Approved' || existing.status === 'Fully Approved' || existing.status === 'Payment Details Submitted' || existing.status === 'Payment Verified' ? 'Approved' : null)
          // Check donor approval via donor_students
          api.get(`/applications/${existing.id}/donor-decision`)
            .then(d => setDonorApproval(d.data?.donor_decision || null))
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [id])

  const updateField = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }))
    if (field === 'mobile') {
      setMobileTouched(true)
      const err = validateMobile(value)
      setErrors(p => ({ ...p, mobile: err }))
    } else if (field === 'email') {
      setEmailTouched(true)
      const err = validateEmail(value)
      setErrors(p => ({ ...p, email: err }))
    } else if (field === 'registration_number') {
      setRegNoTouched(true)
      const err = validateRegNo(value)
      setErrors(p => ({ ...p, registration_number: err }))
    } else if (field === 'father_contact') {
      setFatherContactTouched(true)
      const err = validateContactNumber(value)
      setErrors(p => ({ ...p, father_contact: err }))
    } else if (field === 'mother_contact') {
      setMotherContactTouched(true)
      const err = validateContactNumber(value)
      setErrors(p => ({ ...p, mother_contact: err }))
    } else {
      setErrors(p => ({ ...p, [field]: '' }))
    }
  }

  // ── Validate per step ──
  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!formData.full_name)         e.full_name         = 'Full name is required'
      if (!formData.postal_address)    e.postal_address    = 'Postal address is required'
      if (!formData.district)          e.district          = 'District is required'
      if (!formData.nic_number)        e.nic_number        = 'NIC number is required'
      
      const regNoErr = validateRegNo(formData.registration_number)
      if (regNoErr) {
        e.registration_number = regNoErr
        setRegNoTouched(true)
      }
      
      const mobileErr = validateMobile(formData.mobile)
      if (mobileErr) {
        e.mobile = mobileErr
        setMobileTouched(true)
      }
      
      const emailErr = validateEmail(formData.email)
      if (emailErr) {
        e.email = emailErr
        setEmailTouched(true)
      }
    }
    if (step === 2) {
      if (!formData.total_family_income) {
        e.total_family_income = 'Total monthly family income is required'
      } else if (parseFloat(formData.total_family_income) < 0) {
        e.total_family_income = 'Total monthly family income must be a positive value'
      }

      if (formData.father_income && parseFloat(formData.father_income) < 0) {
        e.father_income = 'Father / Guardian Monthly Income must be a positive value'
      }
      if (formData.mother_income && parseFloat(formData.mother_income) < 0) {
        e.mother_income = 'Mother / Guardian Monthly Income must be a positive value'
      }
      if (formData.other_scholarship_amount && parseFloat(formData.other_scholarship_amount) < 0) {
        e.other_scholarship_amount = 'Total Other Scholarship Amount must be a positive value'
      }

      const fatherContactErr = validateContactNumber(formData.father_contact)
      if (fatherContactErr) {
        e.father_contact = fatherContactErr
        setFatherContactTouched(true)
      }

      const motherContactErr = validateContactNumber(formData.mother_contact)
      if (motherContactErr) {
        e.mother_contact = motherContactErr
        setMotherContactTouched(true)
      }
    }
    if (step === 3) {
      if (!formData.current_year) e.current_year = 'Current year is required'
      if (!formData.semester)     e.semester     = 'Semester is required'
      if (formData.current_year !== '1st Year' && !formData.gpa)
        e.gpa = 'GPA is required for 2nd year and above'
      if (formData.gpa && (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4))
        e.gpa = 'GPA must be 0.00 – 4.00'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => { if (validate()) setStep(s => Math.min(s + 1, 5)) }
  const handleBack = () => setStep(s => Math.max(s - 1, 0))

  // ── Save draft (create application record) ──
  const handleSaveDraft = async () => {
    try {
      const payload = buildPayload()
      const res = await api.post('/student/applications', { ...payload, status_override: 'Draft' })
      setSavedAppId(res.data.id)
      toast.success('Draft saved!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save draft')
    }
  }

  const buildPayload = () => ({
    scholarship_id:      id,
    student_name:        formData.full_name,
    registration_number: formData.registration_number,
    batch:               formData.batch,
    email:               formData.email,
    phone:               formData.mobile,
    department:          formData.department,
    current_year:        formData.current_year,
    gpa:                 formData.gpa || null,
    monthly_income:      formData.total_family_income || null,
    num_dependents:      formData.num_dependents || null,
    // Extended fields as JSON
    extra_data: JSON.stringify({
      postal_address:     formData.postal_address,
      district:           formData.district,
      nic_number:         formData.nic_number,
      school_siblings:    formData.school_siblings || [],
      uni_siblings:       formData.uni_siblings    || [],
      father_name:        formData.father_name,
      father_occupation:  formData.father_occupation,
      father_income:      formData.father_income,
      mother_name:        formData.mother_name,
      mother_occupation:  formData.mother_occupation,
      mother_income:      formData.mother_income,
      num_family_members: formData.num_family_members,
      school_children_count: formData.school_children_count,
      uni_students_count: formData.uni_students_count,
      receiving_mahapola: formData.receiving_mahapola,
      receiving_bursary:  formData.receiving_bursary,
      other_scholarships: formData.other_scholarships,
      semester:           formData.semester,
    })
  })

  const handleSubmit = async () => {
    // Perform final validation check before submission
    const regNoErr = validateRegNo(formData.registration_number)
    const mobileErr = validateMobile(formData.mobile)
    const emailErr = validateEmail(formData.email)
    const fatherContactErr = validateContactNumber(formData.father_contact)
    const motherContactErr = validateContactNumber(formData.mother_contact)

    if (regNoErr || mobileErr || emailErr || fatherContactErr || motherContactErr) {
      setRegNoTouched(true)
      setMobileTouched(true)
      setEmailTouched(true)
      setFatherContactTouched(true)
      setMotherContactTouched(true)
      setErrors(p => ({
        ...p,
        registration_number: regNoErr,
        mobile: mobileErr,
        email: emailErr,
        father_contact: fatherContactErr,
        mother_contact: motherContactErr
      }))

      if (regNoErr || mobileErr || emailErr) {
        setStep(0) // Prevent submission and return to step 1
        setTimeout(() => {
          const fieldId = regNoErr ? 'registration_number' : (mobileErr ? 'mobile' : 'email')
          const element = document.getElementById(fieldId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
          }
        }, 100)
      } else {
        setStep(2) // Prevent submission and return to step 3 (Financial Details)
        setTimeout(() => {
          const fieldId = fatherContactErr ? 'father_contact' : 'mother_contact'
          const element = document.getElementById(fieldId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
          }
        }, 100)
      }

      toast.error(regNoErr || mobileErr || emailErr || fatherContactErr || motherContactErr)
      return
    }

    if (!declared) { toast.error('Please check the declaration checkbox'); return }
    const uploadedCount = Object.values(docs).filter(Boolean).length
    if (uploadedCount < REQUIRED_DOCS.length) {
      toast.error(`Please upload all ${REQUIRED_DOCS.length} required documents first`)
      return
    }
    setSubmitting(true)
    try {
      const payload = buildPayload()
      await api.post('/student/applications', payload)
      toast.success('Application submitted successfully!')
      navigate('/student/applications')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────
  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>
  if (!scholarship) return <div className="p-8 text-center text-slate-400">Not found.</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/student/scholarships"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-600 transition-colors">
        <ArrowLeft size={15}/> Back to Scholarships
      </Link>

      {/* ── Detail view ── */}
      {!applying ? (
        <div className="card p-6 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{scholarship.title}</h1>
              {scholarship.donor_name && (
                <p className="text-sm text-purple-600 mt-1">
                  Offered by {scholarship.donor_name} · {scholarship.organization || ''}
                </p>
              )}
            </div>
            <span className="badge-green">Active</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 font-medium">Funding Amount</p>
              <p className="font-bold text-green-700 mt-1">LKR {Number(scholarship.funding_amount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-600 font-medium">Deadline</p>
              <p className="font-bold text-amber-700 mt-1 text-sm">
                {scholarship.application_deadline
                  ? new Date(scholarship.application_deadline).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
                  : '—'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 font-medium">Eligible Batch</p>
              <p className="font-bold text-blue-700 mt-1">{scholarship.eligible_batch || 'All'}</p>
            </div>
          </div>

          {scholarship.description && (
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Description</h3>
              <p className="text-sm text-slate-600">{scholarship.description}</p>
            </div>
          )}
          {scholarship.eligibility_criteria && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-purple-700 mb-1">Eligibility Criteria</h3>
              <p className="text-sm text-purple-600">{scholarship.eligibility_criteria}</p>
            </div>
          )}
          {scholarship.required_documents && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Required Documents</h3>
              <p className="text-sm text-slate-600">{scholarship.required_documents}</p>
            </div>
          )}

          <button onClick={() => setApplying(true)} className="btn-primary w-full py-3 text-base">
            Apply for This Scholarship
          </button>
        </div>
      ) : (
        /* ── Application wizard ── */
        <div className="card p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 text-center">
              Application — {scholarship.title}
            </h2>
            <p className="text-xs text-center text-slate-400 mt-1">Step {step + 1} of {STEPS.length}</p>
          </div>

          <StepIndicator current={step} />

          {/* Step content */}
          <div className="min-h-[300px]">
            {step === 0 && <Step1Personal data={formData} onChange={updateField} errors={errors} mobileTouched={mobileTouched} emailTouched={emailTouched} />}
            {step === 1 && <Step2Family   data={formData} onChange={updateField} />}
            {step === 2 && <Step3Financial data={formData} onChange={updateField} errors={errors} fatherContactTouched={fatherContactTouched} motherContactTouched={motherContactTouched} />}
            {step === 3 && <Step4Academic  data={formData} onChange={updateField} errors={errors} />}
            {step === 4 && (
              <div className="space-y-6">
                <Step5Documents appId={savedAppId} onDocsChange={setDocs} onNeedSave={handleSaveDraft} />

                {/* Declaration */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={declared} onChange={e => setDeclared(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 flex-shrink-0" />
                    <span className="text-sm text-slate-700 leading-relaxed">
                      I certify that all information provided in this application is <strong>true and accurate</strong>.
                      I understand that any false information may result in disqualification.
                    </span>
                  </label>
                </div>
              </div>
            )}
            {step === 5 && (
              <Step6PaymentDetails
                applicationId={savedAppId}
                applicationStatus={null}
                adminApproval={adminApproval}
                donorApproval={donorApproval}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 flex-wrap gap-3">
            <button onClick={handleBack} disabled={step === 0}
              className="btn-ghost disabled:opacity-40">
              ← Back
            </button>

            <div className="flex items-center gap-3">
              {/* Save Draft visible from step 3 onwards so student can get an appId before Step 5 */}
              {step >= 3 && (
                <button onClick={handleSaveDraft}
                  className="btn-secondary text-sm px-4 py-2">
                  {savedAppId ? 'Save Draft' : 'Save Draft'}
                </button>
              )}

              {/* Steps 0-3: Next button */}
              {step < 4 && (
                <button onClick={handleNext} className="btn-primary px-8">
                  Next →
                </button>
              )}

              {/* Step 4 (Documents): Submit Application */}
              {step === 4 && (
                <button onClick={handleSubmit} disabled={submitting || !declared || validateRegNo(formData.registration_number) !== '' || validateMobile(formData.mobile) !== '' || validateEmail(formData.email) !== '' || validateContactNumber(formData.father_contact) !== '' || validateContactNumber(formData.mother_contact) !== ''}
                  className="btn-primary px-8 disabled:opacity-50">
                  {submitting
                    ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Submitting...</span>
                    : '✓ Submit Application'}
                </button>
              )}

              {/* Step 5 (Payment): just show Next to go back or close */}
              {step === 5 && (
                <button onClick={() => navigate('/student/applications')}
                  className="btn-primary px-8">
                  Go to My Applications
                </button>
              )}
            </div>
          </div>

          <div className="text-center mt-3">
            <button onClick={() => { setApplying(false); setStep(0); setFormData({}); setErrors({}) }}
              className="text-xs text-slate-400 hover:text-slate-600">
              Cancel application
            </button>
          </div>
        </div>
      )}
    </div>
  )
}