import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader, Home, FileText, AlertCircle } from 'lucide-react'
import { paymentAPI } from '../../services/api'
import Logo from '../../assets/LP_Logo.png'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState(null)
  const [retrying, setRetrying] = useState(false)

  const orderId = searchParams.get('orderId')

  const verifyPayment = useCallback(async () => {
    try {
      setRetrying(true)
      setLoading(true)
      setError(null)

      // First try to verify payment success
      const response = await paymentAPI.verifyPaymentSuccess(orderId)
      
      if (response.success) {
        setPaymentData(response.data)
        
        // If still processing, poll for status
        if (response.data.status === 'processing') {
          pollPaymentStatus(orderId)
        }
      } else {
        setError(response.message || 'Payment verification failed')
      }
    } catch (err) {
      console.error('Payment verification error:', err)
      setError(err.response?.data?.message || 'Failed to verify payment')
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) {
      verifyPayment()
    } else {
      setError('No order ID provided')
      setLoading(false)
    }
  }, [orderId, verifyPayment])

  const pollPaymentStatus = async (orderIdToPoll) => {
    let attempts = 0
    const maxAttempts = 10

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        return
      }

      try {
        const response = await paymentAPI.getPaymentStatus(orderIdToPoll)
        if (response.data.paymentStatus === 'paid') {
          setPaymentData(prev => ({
            ...prev,
            order: { ...prev?.order, paymentStatus: 'paid' }
          }))
          return
        }
        
        attempts++
        setTimeout(checkStatus, 3000) // Check every 3 seconds
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    setTimeout(checkStatus, 3000)
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

  const handleViewReceipt = () => {
    navigate('/dashboard/client/receipts')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <h2 className="text-xl font-semibold mb-2">Verifying Payment...</h2>
          <p className="text-base-content/60">Please wait while we confirm your payment.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-2xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-error/10">
              <AlertCircle className="text-error" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-error mb-2">Payment Issue</h2>
            <p className="text-base-content/70 mb-6">{error}</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={verifyPayment} 
                className="btn btn-primary"
                disabled={retrying}
              >
                {retrying ? (
                  <>
                    <Loader className="animate-spin mr-2" size={18} />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </button>
              <button onClick={handleGoToDashboard} className="btn btn-ghost">
                <Home size={18} className="mr-2" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isPaid = paymentData?.order?.paymentStatus === 'paid'
  const isProcessing = paymentData?.status === 'processing'

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl max-w-md w-full">
        <div className="card-body text-center">
          <div className="flex justify-center mb-4">
            <img src={Logo} alt="Laundry Planet" className="w-16 h-16" />
          </div>

          <div className="mx-auto mb-4 p-4 rounded-full bg-success/10">
            {isProcessing ? (
              <Loader className="animate-spin text-warning" size={48} />
            ) : (
              <CheckCircle className="text-success" size={48} />
            )}
          </div>

          <h2 className="text-2xl font-bold text-success mb-2">
            {isProcessing ? 'Payment Processing' : 'Payment Successful!'}
          </h2>
          
          <p className="text-base-content/70 mb-6">
            {isProcessing 
              ? 'Your payment is being processed. Please wait...'
              : 'Thank you! Your payment has been received.'}
          </p>

          {paymentData?.order && (
            <div className="bg-base-200 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Book Number</span>
                  <span className="font-semibold">{paymentData.order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Amount Paid</span>
                  <span className="font-semibold text-primary">
                    ₱{paymentData.order.totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Payment Method</span>
                  <span className="font-semibold">GCash</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Status</span>
                  <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                    {isPaid ? 'Paid' : 'Processing'}
                  </span>
                </div>
                {paymentData.order.paymentDetails?.gcashReferenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Reference No.</span>
                    <span className="font-mono text-xs">
                      {paymentData.order.paymentDetails.gcashReferenceNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={handleGoToDashboard} className="btn btn-primary">
              <Home size={18} className="mr-2" />
              Go to Dashboard
            </button>
            {isPaid && (
              <button onClick={handleViewReceipt} className="btn btn-outline">
                <FileText size={18} className="mr-2" />
                View Receipt
              </button>
            )}
          </div>

          <p className="text-xs text-base-content/50 mt-4">
            A confirmation email will be sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
