import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { XCircle, Loader, Home, RefreshCw, AlertTriangle } from 'lucide-react'
import { paymentAPI, orderAPI } from '../../services/api'
import Logo from '../../assets/LP_Logo.png'

const PaymentFailed = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [orderData, setOrderData] = useState(null)
  const [error, setError] = useState(null)
  const [retrying, setRetrying] = useState(false)

  const orderId = searchParams.get('orderId')

  const handleFailure = useCallback(async () => {
    try {
      setLoading(true)
      
      // Notify backend about the failed payment
      const response = await paymentAPI.handlePaymentFailed(orderId)
      
      if (response.success) {
        setOrderData(response.data.order)
      }
    } catch (err) {
      console.error('Handle payment failed error:', err)
      // Still try to get order info
      try {
        const orderResponse = await orderAPI.getOrderById(orderId)
        if (orderResponse.data) {
          setOrderData(orderResponse.data)
        }
      } catch {
        setError('Failed to retrieve order information')
      }
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) {
      handleFailure()
    } else {
      setError('No order ID provided')
      setLoading(false)
    }
  }, [orderId, handleFailure])

  const handleRetryPayment = async () => {
    try {
      setRetrying(true)
      setError(null)

      const response = await paymentAPI.retryPayment(orderId)
      
      if (response.success && response.data.checkoutUrl) {
        // Redirect to GCash checkout
        window.location.href = response.data.checkoutUrl
      } else {
        setError('Failed to initiate retry. Please try again.')
      }
    } catch (err) {
      console.error('Retry payment error:', err)
      setError(err.response?.data?.message || 'Failed to retry payment')
    } finally {
      setRetrying(false)
    }
  }

  const handleGoToDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role === 'client') {
      navigate('/dashboard/client')
    } else if (user.role === 'staff') {
      navigate('/dashboard/staff')
    } else if (user.role === 'admin') {
      navigate('/dashboard/admin')
    } else {
      navigate('/')
    }
  }

  const handleChangeToCash = async () => {
    try {
      setLoading(true)
      
      // Update order to use cash payment instead
      await orderAPI.updateOrderStatus(orderId, orderData?.status || 'pending', 
        'Changed payment method to Cash due to GCash payment failure')
      
      navigate('/dashboard/client')
    } catch {
      setError('Failed to update payment method')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-base-content/60">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl max-w-md w-full">
        <div className="card-body text-center">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="Laundry Planet" className="w-16 h-16" />
          </div>

          <div className="mx-auto mb-4 p-4 rounded-full bg-error/10">
            <XCircle className="text-error" size={48} />
          </div>

          <h2 className="text-2xl font-bold text-error mb-2">Payment Failed</h2>
          
          <p className="text-base-content/70 mb-6">
            Your GCash payment was not completed. This could be due to:
          </p>

          <div className="bg-warning/10 rounded-lg p-4 mb-6 text-left">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <span>Payment was cancelled by user</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <span>Insufficient GCash balance</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <span>Session timeout or network issue</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <span>GCash service temporarily unavailable</span>
              </li>
            </ul>
          </div>

          {orderData && (
            <div className="bg-base-200 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Order Number</span>
                  <span className="font-semibold">{orderData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Amount</span>
                  <span className="font-semibold text-primary">
                    ₱{orderData.totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Payment Status</span>
                  <span className="badge badge-error">Unpaid</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <AlertTriangle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRetryPayment} 
              className="btn btn-primary"
              disabled={retrying}
            >
              {retrying ? (
                <>
                  <Loader className="animate-spin mr-2" size={18} />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw size={18} className="mr-2" />
                  Retry GCash Payment
                </>
              )}
            </button>
            
            <button onClick={handleChangeToCash} className="btn btn-outline">
              Pay Cash Instead
            </button>
            
            <button onClick={handleGoToDashboard} className="btn btn-ghost">
              <Home size={18} className="mr-2" />
              Go to Dashboard
            </button>
          </div>

          <p className="text-xs text-base-content/50 mt-4">
            Your order has been saved. You can retry payment anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentFailed
