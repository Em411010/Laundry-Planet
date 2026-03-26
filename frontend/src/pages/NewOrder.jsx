import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClientSidebar, ClientNavbar } from '../components/navbars/ClientNavbar'
import { orderAPI, serviceAPI, profileAPI } from '../services/api'
import { ShoppingCart, Calendar, Clock, CreditCard, AlertCircle, CheckCircle, MapPin, Phone, Map, Edit } from 'lucide-react'

const NewOrder = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [services, setServices] = useState([])
  const [profile, setProfile] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  const [editingAddress, setEditingAddress] = useState(false)
  
  const [orderDetails, setOrderDetails] = useState({
    pickupDate: '',
    pickupTime: '09:00',
    deliverDate: '',
    deliverTime: '',
    paymentMethod: 'cash',
    specialInstructions: ''
  })

  const [pickupAddress, setPickupAddress] = useState({
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
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [servicesRes, profileRes] = await Promise.all([
        serviceAPI.getPublicServices(),
        profileAPI.getProfile()
      ])
      
      setServices(servicesRes.data.filter(s => s.isActive))
      setProfile(profileRes.data)

      // Initialize address from profile
      if (profileRes.data) {
        setPickupAddress({
          houseUnitLot: profileRes.data.address?.houseUnitLot || '',
          streetName: profileRes.data.address?.streetName || '',
          barangay: profileRes.data.address?.barangay || '',
          city: profileRes.data.address?.city || '',
          province: profileRes.data.address?.province || '',
          zipCode: profileRes.data.address?.zipCode || '',
          landmark: profileRes.data.address?.landmark || '',
          fullAddress: profileRes.data.address?.fullAddress || '',
          latitude: profileRes.data.location?.coordinates[1] || '',
          longitude: profileRes.data.location?.coordinates[0] || ''
        })
      }

      // Check if profile is complete
      if (!profileRes.data.profileComplete) {
        toast.error('Please complete your profile before placing a book')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setOrderDetails(prev => {
      let updated = { ...prev, [name]: value }
      // If pickupDate or pickupTime changes, auto-set deliverDate/time to 24h after
      if (name === 'pickupDate' || name === 'pickupTime') {
        if ((name === 'pickupDate' && value && prev.pickupTime) || (name === 'pickupTime' && value && prev.pickupDate)) {
          const dateStr = name === 'pickupDate' ? value : prev.pickupDate
          const timeStr = name === 'pickupTime' ? value : prev.pickupTime
          if (dateStr && timeStr) {
            const pickupDT = new Date(`${dateStr}T${timeStr}`)
            const deliverDT = new Date(pickupDT.getTime() + 24 * 60 * 60 * 1000)
            updated.deliverDate = deliverDT.toISOString().slice(0, 10)
            updated.deliverTime = deliverDT.toTimeString().slice(0, 5)
          }
        }
      }
      return updated
    })
  }

  // Auto-generate full address when address fields change
  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setPickupAddress(prev => {
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
    const lat = pickupAddress.latitude || 14.5995
    const lng = pickupAddress.longitude || 120.9842
    window.open(`https://www.google.com/maps/@${lat},${lng},15z`, '_blank')
  }

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupAddress(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          }))
          toast.success('Location captured successfully!')
        },
        () => {
          toast.error('Unable to get your location. Please enter manually or use Google Maps.')
        }
      )
    } else {
      toast.error('Geolocation is not supported by your browser.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!profile?.profileComplete) {
      toast.error('Please complete your profile first')
      return
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }

    if (!pickupAddress.fullAddress) {
      toast.error('Please provide a complete pickup address')
      return
    }

    try {
      setSubmitting(true)

      const orderData = {
        services: selectedServices.map(serviceId => ({
          serviceId,
          quantity: 1 // Default to 1, will be updated by staff after weighing
        })),
        pickupDate: orderDetails.pickupDate,
        pickupTime: orderDetails.pickupTime,
        deliverDate: orderDetails.deliverDate,
        deliverTime: orderDetails.deliverTime,
        paymentMethod: orderDetails.paymentMethod,
        specialInstructions: orderDetails.specialInstructions,
        customAddress: {
          houseUnitLot: pickupAddress.houseUnitLot,
          streetName: pickupAddress.streetName,
          barangay: pickupAddress.barangay,
          city: pickupAddress.city,
          province: pickupAddress.province,
          zipCode: pickupAddress.zipCode,
          landmark: pickupAddress.landmark,
          fullAddress: pickupAddress.fullAddress,
          location: {
            type: 'Point',
            coordinates: [
              parseFloat(pickupAddress.longitude) || 0,
              parseFloat(pickupAddress.latitude) || 0
            ]
          }
        }
      }

      const response = await orderAPI.createOrder(orderData)

      // Payment will be processed after staff weighs the laundry
      const paymentNote = orderDetails.paymentMethod === 'gcash' 
        ? ' You will receive a payment link once your laundry is weighed and priced.'
        : ' Payment will be collected upon delivery.'

      toast.success(`Book ${response.data.orderNumber} placed successfully!${paymentNote}`)
      setTimeout(() => {
        navigate('/dashboard/client')
      }, 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place book')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <ClientSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <ClientNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">New Book</h1>
          </div>{!profile?.profileComplete && (
            <div className="alert alert-warning mb-6">
              <AlertCircle className="h-5 w-5" />
              <div>
                <span className="font-semibold">Profile Incomplete</span>
                <div className="text-sm">Please complete your profile before placing a book.</div>
              </div>
              <button
                onClick={() => navigate('/dashboard/client/profile')}
                className="btn btn-sm btn-outline"
              >
                Complete Profile
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title mb-2">Select Services</h2>
                    <p className="text-sm text-base-content/70 mb-4">
                      Note: Staff will weigh your laundry during pickup to calculate the final amount.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <div 
                          key={service._id} 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedServices.includes(service._id) 
                              ? 'border-primary bg-primary/10' 
                              : 'border-base-300 hover:border-primary/50'
                          }`}
                          onClick={() => toggleService(service._id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedServices.includes(service._id)}
                                  onChange={() => {}}
                                  className="checkbox checkbox-primary checkbox-sm"
                                />
                                <h3 className="font-bold text-lg">{service.name}</h3>
                              </div>
                              <p className="text-sm text-base-content/70 ml-7">{service.category}</p>
                              <p className="text-xl font-bold text-primary mt-2 ml-7">₱{service.price}</p>
                              <p className="text-xs text-base-content/60 ml-7">{service.unit}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div><div className="lg:col-span-1">
                <form onSubmit={handleSubmit}><div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                      <h2 className="card-title">Selected Services</h2>
                      
                      {selectedServices.length === 0 ? (
                        <p className="text-base-content/60 text-sm">No services selected</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedServices.map((serviceId) => {
                            const service = services.find(s => s._id === serviceId)
                            return (
                              <div key={serviceId} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span className="text-sm flex-1">{service?.name}</span>
                                <span className="text-xs badge badge-primary">{service?.unit}</span>
                              </div>
                            )
                          })}
                          <div className="alert alert-info mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">Final cost will be calculated after staff weighs your laundry</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div><div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                      <h2 className="card-title mb-4">Pickup Details</h2>
                      
                      <div className="form-control mb-4">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Pickup Date *
                          </span>
                        </label>
                        <input
                          type="date"
                          name="pickupDate"
                          className="input input-bordered w-full"
                          min={getMinDate()}
                          value={orderDetails.pickupDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-control mb-4">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Pickup Time *
                          </span>
                        </label>
                        <select
                          name="pickupTime"
                          className="select select-bordered w-full"
                          value={orderDetails.pickupTime}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="09:00">9:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">1:00 PM</option>
                          <option value="14:00">2:00 PM</option>
                          <option value="15:00">3:00 PM</option>
                          <option value="16:00">4:00 PM</option>
                          <option value="17:00">5:00 PM</option>
                        </select>
                      </div>

                      <div className="form-control mb-4">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Delivery Date *
                          </span>
                        </label>
                        <input
                          type="date"
                          name="deliverDate"
                          className="input input-bordered w-full"
                          min={orderDetails.pickupDate ? (() => {
                            if (!orderDetails.pickupDate || !orderDetails.pickupTime) return '';
                            const pickupDT = new Date(`${orderDetails.pickupDate}T${orderDetails.pickupTime}`);
                            const deliverDT = new Date(pickupDT.getTime() + 24 * 60 * 60 * 1000);
                            return deliverDT.toISOString().slice(0, 10);
                          })() : getMinDate()}
                          value={orderDetails.deliverDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-control mb-4">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Delivery Time *
                          </span>
                        </label>
                        <select
                          name="deliverTime"
                          className="select select-bordered w-full"
                          value={orderDetails.deliverTime}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="09:00">9:00 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="12:00">12:00 PM</option>
                          <option value="13:00">1:00 PM</option>
                          <option value="14:00">2:00 PM</option>
                          <option value="15:00">3:00 PM</option>
                          <option value="16:00">4:00 PM</option>
                          <option value="17:00">5:00 PM</option>
                        </select>
                      </div>

                      <div className="form-control mb-4">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Method *
                          </span>
                        </label>
                        <select
                          name="paymentMethod"
                          className="select select-bordered w-full"
                          value={orderDetails.paymentMethod}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="cash">Cash on Delivery</option>
                          <option value="gcash">GCash</option>
                        </select>
                        {orderDetails.paymentMethod === 'gcash' && (
                          <div className="mt-2 p-3 bg-info/10 rounded-lg">
                            <p className="text-sm text-info flex items-center gap-2">
                              <AlertCircle size={16} />
                              You'll receive a payment link once your laundry is weighed and final price is calculated.
                            </p>
                            <p className="text-xs text-base-content/60 mt-1">
                              Pay securely via GCash before delivery. Minimum: ₱100
                            </p>
                          </div>
                        )}
                        {orderDetails.paymentMethod === 'cash' && (
                          <div className="mt-2 p-3 bg-base-200 rounded-lg">
                            <p className="text-sm text-base-content/70">
                              Payment will be collected by delivery staff when your laundry is delivered.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="form-control mb-4">
                        <label className="label">
                          <span className="label-text">Special Instructions</span>
                        </label>
                        <textarea
                          name="specialInstructions"
                          className="textarea textarea-bordered h-20 w-full"
                          placeholder="Any special requests or instructions..."
                          value={orderDetails.specialInstructions}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div><div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="card-title flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Pickup Address
                        </h2>
                        <button
                          type="button"
                          onClick={() => setEditingAddress(!editingAddress)}
                          className="btn btn-sm btn-ghost gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          {editingAddress ? 'Cancel' : 'Edit'}
                        </button>
                      </div>

                      {!editingAddress ? (
                        <>
                          <div className="space-y-2 text-sm">
                            {pickupAddress.houseUnitLot && (
                              <p><span className="font-semibold">House / Unit / Lot No.:</span> {pickupAddress.houseUnitLot}</p>
                            )}
                            {pickupAddress.streetName && (
                              <p><span className="font-semibold">Street Name:</span> {pickupAddress.streetName}</p>
                            )}
                            {pickupAddress.barangay && (
                              <p><span className="font-semibold">Barangay:</span> {pickupAddress.barangay}</p>
                            )}
                            {pickupAddress.city && (
                              <p><span className="font-semibold">City / Municipality:</span> {pickupAddress.city}</p>
                            )}
                            {pickupAddress.province && (
                              <p><span className="font-semibold">Province:</span> {pickupAddress.province}</p>
                            )}
                            {pickupAddress.zipCode && (
                              <p><span className="font-semibold">Postal / ZIP Code:</span> {pickupAddress.zipCode}</p>
                            )}
                            {pickupAddress.landmark && (
                              <p><span className="font-semibold">Landmark:</span> {pickupAddress.landmark}</p>
                            )}
                            <div className="divider my-2"></div>
                            <p className="font-semibold">Complete Address:</p>
                            <p className="bg-base-200 p-3 rounded">{pickupAddress.fullAddress || 'No address provided'}</p>
                            
                            {profile && (
                              <p className="flex items-center gap-2 mt-3">
                                <Phone className="h-4 w-4" />
                                <span className="font-semibold">Contact:</span> {profile.phone}
                              </p>
                            )}

                            {pickupAddress.latitude && pickupAddress.longitude && 
                             pickupAddress.latitude !== '0' && pickupAddress.longitude !== '0' && (
                              <div className="mt-4">
                                <p className="font-semibold mb-2 flex items-center gap-2">
                                  <Map className="h-4 w-4" />
                                  Pin Location
                                </p>
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-base-300">
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    src={`https://maps.google.com/maps?q=${pickupAddress.latitude},${pickupAddress.longitude}&z=15&output=embed`}
                                    title="Location Preview"
                                  />
                                </div>
                                <p className="text-xs text-base-content/60 mt-1">
                                  Coordinates: {pickupAddress.latitude}, {pickupAddress.longitude}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="form-control">
                                <label className="label label-text-alt">House / Unit / Lot No.</label>
                                <input
                                  type="text"
                                  name="houseUnitLot"
                                  className="input input-bordered input-sm"
                                  value={pickupAddress.houseUnitLot}
                                  onChange={handleAddressChange}
                                />
                              </div>
                              <div className="form-control">
                                <label className="label label-text-alt">Street Name</label>
                                <input
                                  type="text"
                                  name="streetName"
                                  className="input input-bordered input-sm"
                                  value={pickupAddress.streetName}
                                  onChange={handleAddressChange}
                                />
                              </div>
                              <div className="form-control">
                                <label className="label label-text-alt">Barangay</label>
                                <input
                                  type="text"
                                  name="barangay"
                                  className="input input-bordered input-sm"
                                  value={pickupAddress.barangay}
                                  onChange={handleAddressChange}
                                />
                              </div>
                              <div className="form-control">
                                <label className="label label-text-alt">City / Municipality</label>
                                <input
                                  type="text"
                                  name="city"
                                  className="input input-bordered input-sm"
                                  value={pickupAddress.city}
                                  onChange={handleAddressChange}
                                />
                              </div>
                              <div className="form-control">
                                <label className="label label-text-alt">Province</label>
                                <input
                                  type="text"
                                  name="province"
                                  className="input input-bordered input-sm"
                                  value={pickupAddress.province}
                                  onChange={handleAddressChange}
                                />
                              </div>
                              <div className="form-control">
                                <label className="label label-text-alt">Postal / ZIP Code</label>
                                <input
                                  type="text"
                                  name="zipCode"
                                  className="input input-bordered input-sm"
                                  value={pickupAddress.zipCode}
                                  onChange={handleAddressChange}
                                />
                              </div>
                            </div>
                            <div className="form-control">
                              <label className="label label-text-alt">Landmark</label>
                              <input
                                type="text"
                                name="landmark"
                                className="input input-bordered input-sm"
                                value={pickupAddress.landmark}
                                onChange={handleAddressChange}
                              />
                            </div>
                            <div className="form-control">
                              <label className="label label-text-alt">Complete Address *</label>
                              <textarea
                                name="fullAddress"
                                className="textarea textarea-bordered h-20"
                                value={pickupAddress.fullAddress}
                                onChange={handleAddressChange}
                                required
                              />
                            </div>

                            <div className="divider">Pin Location</div>

                            <div className="flex gap-2 mb-3">
                              <button
                                type="button"
                                onClick={getMyLocation}
                                className="btn btn-sm btn-outline btn-primary gap-1 flex-1"
                              >
                                <MapPin className="h-3 w-3" />
                                Use Current
                              </button>
                              <button
                                type="button"
                                onClick={openGoogleMaps}
                                className="btn btn-sm btn-outline gap-1 flex-1"
                              >
                                <Map className="h-3 w-3" />
                                Google Maps
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="form-control">
                                <label className="label label-text-alt">Latitude</label>
                                <input
                                  type="number"
                                  name="latitude"
                                  className="input input-bordered input-sm"
                                  step="any"
                                  value={pickupAddress.latitude}
                                  onChange={handleAddressChange}
                                />
                              </div>
                              <div className="form-control">
                                <label className="label label-text-alt">Longitude</label>
                                <input
                                  type="number"
                                  name="longitude"
                                  className="input input-bordered input-sm"
                                  step="any"
                                  value={pickupAddress.longitude}
                                  onChange={handleAddressChange}
                                />
                              </div>
                            </div>

                            {pickupAddress.latitude && pickupAddress.longitude && 
                             pickupAddress.latitude !== '0' && pickupAddress.longitude !== '0' && (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-base-300 mt-3">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  src={`https://maps.google.com/maps?q=${pickupAddress.latitude},${pickupAddress.longitude}&z=15&output=embed`}
                                  title="Location Preview"
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div><button
                    type="submit"
                    className="btn btn-primary btn-block gap-2"
                    disabled={submitting || !profile?.profileComplete || selectedServices.length === 0}
                  >
                    {submitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Placing Book...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Place Book
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewOrder



