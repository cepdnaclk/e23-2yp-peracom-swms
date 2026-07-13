import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState(
    'Please wait while we verify your email address.'
  )

  // Prevent React StrictMode from sending the request twice
  const verificationStarted = useRef(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (verificationStarted.current) return
    verificationStarted.current = true

    if (!token) {
      setStatus('error')
      setMessage('The verification token is missing.')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post('/auth/verify-email', {
          token
        })

        setStatus('success')
        setMessage(
          response.data.message ||
            'Email verified successfully. Please wait for admin approval.'
        )
      } catch (error) {
        setStatus('error')
        setMessage(
          error.response?.data?.message ||
            'Unable to verify your email address.'
        )
      }
    }

    verifyEmail()
  }, [token])

  const goToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-14 h-14 mx-auto mb-5 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />

            <h1 className="text-2xl font-bold text-slate-900">
              Email Verification
            </h1>

            <p className="mt-4 text-slate-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-5">✅</div>

            <h1 className="text-2xl font-bold text-slate-900">
              Email Verified
            </h1>

            <p className="mt-4 text-slate-600">{message}</p>

            <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Your account must be approved by an administrator before you can
              log in.
            </p>

            <button
              type="button"
              onClick={goToLogin}
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors cursor-pointer"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-5">❌</div>

            <h1 className="text-2xl font-bold text-slate-900">
              Email Verification
            </h1>

            <p className="mt-4 text-slate-600">{message}</p>

            <button
              type="button"
              onClick={goToLogin}
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors cursor-pointer"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}