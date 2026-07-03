import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import { UPLogo } from '../../components/common/UPLogo'
import api from '../../services/api'

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const onSubmit = async ({ email }) => {
    await api.post('/auth/forgot-password', { email }).catch(() => {})
    setSentEmail(email)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center"><UPLogo size="lg" /></div>
            <h1 className="text-xl font-bold text-slate-800">Forgot Password</h1>
          </div>

          {!sent ? (
            <>
              <p className="text-sm text-slate-500 text-center">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                  <input type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="Enter your email"
                    className="input-field" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-3 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail size={28} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-800">Check your email</h2>
              <p className="text-sm text-slate-500">
                We sent a password reset link to <span className="font-medium text-slate-700">{sentEmail}</span>
              </p>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
