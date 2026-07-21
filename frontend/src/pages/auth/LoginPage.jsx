import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { UPLogo } from '../../components/common/UPLogo'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [showPass, setShowPass] = useState(false)

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password)
      if (user.status === 'pending_approval') {
        toast.error('Your account is pending admin approval.')
        return
      }
      if (user.status === 'suspended') {
        toast.error('Your account has been suspended.')
        return
      }
      const redirectMap = { admin: '/dashboard', student: '/student/dashboard', donor: '/donor/dashboard' }
      navigate(redirectMap[user.role] || '/login')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <UPLogo size="lg" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">University of Peradeniya</h1>
            <p className="text-sm text-slate-500">Faculty of Engineering · Department of Computer Engineering</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="Enter your email"
                className="input-field"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600">Password</label>
                <Link to="/forgot-password" className="text-xs text-purple-600 hover:text-purple-800">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  placeholder="Enter your password"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base">
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-3">Don't have an account?</p>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/register/student" className="btn-secondary text-center text-sm py-2.5">
                Student Register
              </Link>
              <Link to="/register/donor" className="btn-secondary text-center text-sm py-2.5">
                Donor Register
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
