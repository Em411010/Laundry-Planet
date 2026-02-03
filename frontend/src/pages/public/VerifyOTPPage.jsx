import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Logo from '../../assets/LP_Logo.png'
import { authAPI } from '../../services/api'

const VerifyOTPPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef([])

  const email = location.state?.email || ''
  const firstName = location.state?.firstName || ''

  useEffect(() => {
    if (!email) {
      navigate('/register')
    }
  }, [email, navigate])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take the last character
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)

    const lastFilledIndex = Math.min(pastedData.length, 5)
    inputRefs.current[lastFilledIndex]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')

    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.verifyOTP({ email, otp: otpString })

      if (response.success) {
        toast.success('Email verified successfully!')
        
        // Store token and user data
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/dashboard/client')
        }, 1500)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return

    setResending(true)

    try {
      const response = await authAPI.resendOTP({ email })
      
      if (response.success) {
        toast.success('OTP sent successfully! Please check your email.')
        setResendTimer(60) // 60 seconds cooldown
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <img src={Logo} alt="Laundry Planet" className="w-24 h-24 mx-auto mb-4" />
            <h2 className="text-3xl font-bold">Verify Your Email</h2>
            <p className="text-base-content/60 mt-2">
              We've sent a 6-digit code to
            </p>
            <p className="font-semibold text-primary">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label justify-center">
                <span className="label-text font-medium">Enter OTP Code</span>
              </label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="input input-bordered w-12 h-14 text-center text-2xl font-bold"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <label className="label justify-center">
                <span className="label-text-alt text-base-content/60">
                  Code expires in 10 minutes
                </span>
              </label>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="divider text-sm">Didn't receive the code?</div>

          <button
            type="button"
            onClick={handleResend}
            className={`btn btn-outline w-full gap-2 ${resending ? 'loading' : ''}`}
            disabled={resending || resendTimer > 0}
          >
            {!resending && <RefreshCw size={16} />}
            {resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : resending
              ? 'Sending...'
              : 'Resend OTP'}
          </button>

          <div className="alert alert-info mt-4">
            <Mail size={20} />
            <div className="text-sm">
              <p className="font-semibold">Check your spam folder</p>
              <p>If you don't see the email, check your spam or junk folder.</p>
            </div>
          </div>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm link link-hover">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTPPage
