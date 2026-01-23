import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientSidebar, ClientNavbar } from '../../components/navbars/ClientNavbar'
import { profileAPI } from '../../services/api'
import { User, MapPin, Phone, Save, AlertCircle, CheckCircle, Map } from 'lucide-react'

const ClientProfile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    houseUnitLot: '',
    streetName: '',
    barangay: '',
    city: '',
    province: '',
    zipCode: '',
    landmark: '',
    fullAddress: '',
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== 'client') {
        navigate('/login')
        return
      }
      setUser(parsedUser)
    } else {
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await profileAPI.getProfile()
      const profile = response.data
      
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        houseUnitLot: profile.address?.houseUnitLot || '',
        streetName: profile.address?.streetName || '',
        barangay: profile.address?.barangay || '',
        city: profile.address?.city || '',
        province: profile.address?.province || '',
        zipCode: profile.address?.zipCode || '',
        landmark: profile.address?.landmark || '',
        fullAddress: profile.address?.fullAddress || '',
        latitude: profile.location?.coordinates[1] || '',
        longitude: profile.location?.coordinates[0] || ''
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate full address when address fields change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if ([
        'houseUnitLot',
        'streetName',
        'barangay',
        'city',
        'province',
        'zipCode',
        'landmark'
      ].includes(name)) {
        const {
          houseUnitLot,
          streetName,
          barangay,
          city,
          province,
          zipCode,
          landmark
        } = { ...updated }
        let address = ''
        if (houseUnitLot) address += houseUnitLot + ', '
        if (streetName) address += streetName + ', '
        if (barangay) address += 'Brgy. ' + barangay + ', '
        if (city) address += city + ', '
        if (province) address += province + ', '
        if (zipCode) address += zipCode + ', '
        if (landmark) address += 'Landmark: ' + landmark
        address = address.replace(/, $/, '')
        updated.fullAddress = address
      }
      return updated
    })
  }

  const openGoogleMaps = () => {
    const lat = formData.latitude || 14.5995
    const lng = formData.longitude || 120.9842
    window.open(`https://www.google.com/maps/@${lat},${lng},15z`, '_blank')
  }

  const getMyLocation = () => {
    if (navigator.geolocation) {
      setSuccess('Getting your location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }))
          setSuccess('Location captured successfully!')
          setTimeout(() => setSuccess(null), 3000)
        },
        (error) => {
          setError('Unable to get your location. Please allow location access.')
          setTimeout(() => setError(null), 3000)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser.')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.phone) {
      setError('Phone number is required')
      return
    }
    if (!formData.fullAddress) {
      setError('Full address is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: {
          houseUnitLot: formData.houseUnitLot,
          streetName: formData.streetName,
          barangay: formData.barangay,
          city: formData.city,
          province: formData.province,
          zipCode: formData.zipCode,
          landmark: formData.landmark,
          fullAddress: formData.fullAddress
        },
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(formData.longitude) || 0,
            parseFloat(formData.latitude) || 0
          ]
        }
      }

      const response = await profileAPI.updateProfile(profileData)
      
      // Update local storage
      const updatedUser = { ...user, ...response.data }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <ClientSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <ClientNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto"><div className="flex items-center gap-3 mb-6 mt-10">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Profile</h1>
          </div><div className="alert alert-info mb-6">
            <AlertCircle className="h-5 w-5" />
            <div>
              <span className="font-semibold">Complete your profile</span>
              <div className="text-sm">Please provide your contact information and address to place orders.</div>
            </div>
          </div>{success && (
            <div className="alert alert-success mb-6">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}{error && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}<div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <form onSubmit={handleSubmit}><h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">First Name</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        className="input input-bordered"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Last Name</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        className="input input-bordered"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div><h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </h2>
                  <div className="form-control mb-6">
                    <label className="label">
                      <span className="label-text font-semibold">Phone Number *</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="input input-bordered w-full"
                      placeholder="+63 912 345 6789"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div><h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address Information
                  </h2>

                  {/* Address Fields - New Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">House / Unit / Lot No.</span>
                      </label>
                      <input
                        type="text"
                        name="houseUnitLot"
                        className="input input-bordered w-full"
                        placeholder="House / Unit / Lot No."
                        value={formData.houseUnitLot}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Street Name</span>
                      </label>
                      <input
                        type="text"
                        name="streetName"
                        className="input input-bordered w-full"
                        placeholder="Street Name"
                        value={formData.streetName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Barangay</span>
                      </label>
                      <input
                        type="text"
                        name="barangay"
                        className="input input-bordered w-full"
                        placeholder="Barangay"
                        value={formData.barangay}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">City / Municipality</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        className="input input-bordered w-full"
                        placeholder="City / Municipality"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Province</span>
                      </label>
                      <input
                        type="text"
                        name="province"
                        className="input input-bordered w-full"
                        placeholder="Province"
                        value={formData.province}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Postal / ZIP Code</span>
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        className="input input-bordered w-full"
                        placeholder="Postal / ZIP Code"
                        value={formData.zipCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-semibold">Complete Address *</span>
                    </label>
                    <textarea
                      name="fullAddress"
                      className="textarea textarea-bordered h-24 w-full"
                      placeholder="Enter your complete address"
                      value={formData.fullAddress}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-control mb-6">
                    <label className="label">
                      <span className="label-text">Landmark</span>
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      className="input input-bordered w-full"
                      placeholder="Landmark (optional)"
                      value={formData.landmark}
                      onChange={handleChange}
                    />
                  </div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Pin Location (Optional)
                  </h2>

                  <div className="alert alert-info mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <div className="text-sm">
                      <p>Click the button below to automatically capture your current location. This helps us provide accurate pickup and delivery services.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <button
                      type="button"
                      onClick={getMyLocation}
                      className="btn btn-primary gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Get My Current Location
                    </button>
                    {formData.latitude && formData.longitude && 
                     formData.latitude !== '' && formData.longitude !== '' && 
                     formData.latitude !== '0' && formData.longitude !== '0' && (
                      <button
                        type="button"
                        onClick={openGoogleMaps}
                        className="btn btn-outline gap-2"
                      >
                        <Map className="h-4 w-4" />
                        View on Google Maps
                      </button>
                    )}
                  </div>

                  {formData.latitude && formData.longitude && 
                   formData.latitude !== '' && formData.longitude !== '' && 
                   formData.latitude !== '0' && formData.longitude !== '0' && (
                    <div className="mb-4">
                      <div className="alert alert-success mb-3">
                        <CheckCircle className="h-5 w-5" />
                        <span>Location captured successfully!</span>
                      </div>
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-base-300 shadow-lg">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&z=15&output=embed`}
                          title="Location Preview"
                        />
                      </div>
                      <p className="text-sm text-base-content/70 mt-2">
                        Coordinates: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div className="card-actions justify-end">
                    <button
                      type="submit"
                      className="btn btn-primary gap-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientProfile
