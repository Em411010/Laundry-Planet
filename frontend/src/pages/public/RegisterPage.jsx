import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Logo from '../../assets/LP_Logo.png'
import { authAPI } from '../../services/api'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    
    try {
      const response = await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      })
      
      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        // Redirect to client dashboard (default role)
        navigate('/dashboard/client')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
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
            <h2 className="text-3xl font-bold">Create Account</h2>
            <p className="text-base-content/60 mt-2">Join Laundry Planet today</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* First Name Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">First Name</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter your first name"
                  className="input input-bordered w-full pl-10"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
              </div>
            </div>

            {/* Last Name Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Last Name</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter your last name"
                  className="input input-bordered w-full pl-10"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
              </div>
            </div>

            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="input input-bordered w-full pl-10"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  placeholder="Create a password"
                  className="input input-bordered w-full pl-10 pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
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

            {/* Confirm Password Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  className="input input-bordered w-full pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn btn-primary w-full mt-6 ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">OR</div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{' '}
              <Link to="/login" className="link link-primary font-medium">
                Sign In
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

export default RegisterPage
