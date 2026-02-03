import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Lock, KeyRound } from 'lucide-react'
import Logo from '../../assets/LP_Logo.png'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await authAPI.forgotPassword({ email })
      toast.success(response.message)
      setTimeout(() => {
        setStep(2)
      }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }
    
    try {
      const response = await authAPI.resetPassword({ email, otp, newPassword })
      toast.success(response.message)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    
    try {
      const response = await authAPI.forgotPassword({ email })
      toast.success('New OTP sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <img src={Logo} alt="Laundry Planet" className="w-24 h-24 mx-auto mb-4" />
            <h2 className="text-3xl font-bold">
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </h2>
            <p className="text-base-content/60 mt-2">
              {step === 1 
                ? 'Enter your email to receive a password reset OTP' 
                : 'Enter the OTP sent to your email and create a new password'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    className="input input-bordered w-full pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">OTP Code</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    className="input input-bordered w-full pl-10"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter new password (min. 8 characters)"
                    className="input input-bordered w-full pl-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="input input-bordered w-full pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm link link-primary"
                  disabled={loading}
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
            </form>
          )}

          <div className="divider">OR</div>

          <div className="text-center space-y-2">
            {step === 2 && (
              <button
                onClick={() => {
                  setStep(1)
                  setOtp('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-sm link link-hover flex items-center justify-center gap-1"
              >
                <ArrowLeft size={16} />
                Back to email
              </button>
            )}
            <Link to="/login" className="text-sm link link-hover flex items-center justify-center gap-1">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
