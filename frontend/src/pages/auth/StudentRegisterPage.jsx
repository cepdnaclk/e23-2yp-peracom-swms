import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { UPLogo } from '../../components/common/UPLogo'
import api from '../../services/api'

export default function StudentRegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [showPass, setShowPass] = useState(false)
  const [batches, setBatches] = useState([])
const [batchesLoading, setBatchesLoading] = useState(true)

useEffect(() => {
  const loadBatches = async () => {
    try {
      const response = await api.get('/auth/batches')
      setBatches(response.data)
    } catch (err) {
      toast.error('Unable to load available batches')
    } finally {
      setBatchesLoading(false)
    }
  }

  loadBatches()
}, [])

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register/student', data)
      toast.success('Registered! Please verify your email and wait for admin approval.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed')
    }
  }

  const Field = ({ name, label, type = 'text', rules = {}, placeholder = '' }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <input type={type} {...register(name, rules)} placeholder={placeholder} className="input-field" />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name].message}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center"><UPLogo size="lg" /></div>
            <h1 className="text-xl font-bold text-slate-800">Student Registration</h1>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⏳ After registration, verify your email then wait for admin approval before you can log in.
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field name="name" label="Full Name *" rules={{ required: 'Full name is required' }} />
            <Field name="email" label="Email Address *" type="email" rules={{ required: 'Email is required' }} />
           <div>
  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
    Phone Number *
  </label>

  <input
    type="tel"
    inputMode="numeric"
    maxLength={10}
    placeholder="e.g. 0771234567"
    {...register('phone', {
      required: 'Phone number is required',

      pattern: {
        value: /^07\d{8}$/,
        message: 'Enter a valid 10-digit phone number starting with 07'
      }
    })}
    onInput={(event) => {
      event.target.value = event.target.value
        .replace(/\D/g, '')
        .slice(0, 10)
    }}
    className="input-field"
  />

  {errors.phone && (
    <p className="text-xs text-red-500 mt-1">
      {errors.phone.message}
    </p>
  )}
</div>
            
            <div>
  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
    Batch *
  </label>

  <select
    {...register('batch', {
      required: 'Please select your batch'
    })}
    defaultValue=""
    disabled={batchesLoading}
    className="input-field"
  >
    <option value="" disabled>
      {batchesLoading ? 'Loading batches...' : 'Select your batch'}
    </option>

    {batches.map((batch) => (
      <option
        key={batch.batch_name}
        value={batch.batch_name}
      >
        Batch {batch.batch_name}
      </option>
    ))}
  </select>

  {errors.batch && (
    <p className="text-xs text-red-500 mt-1">
      {errors.batch.message}
    </p>
  )}
</div>
            <Field name="registration_number" label="Registration Number" placeholder="e.g. E/18/001" />

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  className="input-field pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password *</label>
              <input type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: v => v === watch('password') || 'Passwords do not match'
                })}
                className="input-field" />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? 'Registering...' : 'Register as Student'}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-purple-600 hover:text-purple-800">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
