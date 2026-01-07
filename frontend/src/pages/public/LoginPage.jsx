import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Logo from '../../assets/LP_Logo.png'
import { authAPI } from '../../services/api'

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await authAPI.login({ email, password })
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        // Redirect based on role
        switch (response.user.role) {
          case 'admin':
            navigate('/dashboard/admin')
            break
          case 'staff':
            navigate('/dashboard/staff')
            break
          case 'client':
          default:
            navigate('/dashboard/client')
            break
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <img src={Logo} alt="Laundry Planet" className="w-24 h-24 mx-auto mb-4" />
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-base-content/60 mt-2">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <span className="text-sm">{error}</span>
              </div>
            )}
            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input input-bordered w-full pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="input input-bordered w-full pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm link link-primary">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">OR</div>

          {/* Create Account Link */}
          <div className="text-center">
            <p className="text-base-content/60">
              Don't have an account?{' '}
              <Link to="/register" className="link link-primary font-medium">
                Create Account
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <Link to="/landing" className="text-sm link link-hover">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
