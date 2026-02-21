import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import { useNavigate } from 'react-router-dom'
import { ClientSidebar, ClientNavbar } from '../../components/navbars/ClientNavbar'
import { orderAPI } from '../../services/api'
import { Package, Calendar, Clock } from 'lucide-react'

const Receipts = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)

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
    if (user) loadReceipts()
  }, [user])

  const loadReceipts = async () => {
    try {
      setLoading(true)
      const res = await orderAPI.getMyOrders()
      setOrders((res.data || []).filter(o => o.status === 'delivered'))
    } catch (err) {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const handleDownloadReceipt = (order) => {
    // Try using jsPDF; if it fails, fall back to printable window (user can Save as PDF)
    try {
      const doc = new jsPDF({ unit: 'pt' })
      doc.setFontSize(16)
      doc.text('Laundry Planet', 40, 50)
      doc.setFontSize(10)
      doc.text(`Receipt - ${order.orderNumber}`, 40, 70)
      doc.setLineWidth(0.5)
      doc.line(40, 78, 560, 78)

      doc.setFontSize(11)
      let y = 100
      doc.text(`Customer: ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`, 40, y)
      y += 16
      doc.text(`Email: ${order.customer?.email || ''}`, 40, y)
      y += 20
      doc.text(`Delivery: ${order.deliverDate ? new Date(order.deliverDate).toLocaleDateString() : 'N/A'} ${order.deliverTime || ''}`, 40, y)
      y += 20
      doc.text(`Payment: ${order.paymentMethod}`, 40, y)
      if (order.paymentReceiver) {
        y += 16
        doc.text(`Received By: ${order.paymentReceiver.firstName} ${order.paymentReceiver.lastName}`, 40, y)
      }

      y += 24
      doc.text('Services', 40, y)
      y += 12
      doc.setFontSize(10)
      (order.services || []).forEach((s) => {
        doc.text(`${s.service.name} — ${s.quantity} ${s.service.unit || ''}`, 40, y)
        doc.text(`₱${s.subtotal.toFixed(2)}`, 480, y, { align: 'right' })
        y += 14
      })

      y += 8
      doc.setFontSize(12)
      doc.text(`Total: ₱${order.totalAmount.toFixed(2)}`, 480, y, { align: 'right' })

      doc.save(`Receipt_${order.orderNumber}.pdf`)
      return
    } catch (err) {
      console.warn('jsPDF generation failed, falling back to print window', err)
    }

    // Fallback: open printable HTML window so user can Save as PDF
    try {
      const html = `
        <html>
          <head>
            <title>Receipt ${order.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #111827 }
              h1 { color: #0ea5a3 }
              .header { display:flex; justify-content:space-between; align-items:center }
              .services { margin-top:16px }
              table { width:100%; border-collapse: collapse }
              th, td { padding:8px; border-bottom:1px solid #e5e7eb }
              .right { text-align:right }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Laundry Planet</h1>
              <div>Receipt • ${order.orderNumber}</div>
            </div>
            <div style="margin-top:12px">
              <strong>Customer:</strong> ${order.customer?.firstName || ''} ${order.customer?.lastName || ''}<br/>
              <strong>Email:</strong> ${order.customer?.email || ''}<br/>
              <strong>Delivery:</strong> ${order.deliverDate ? new Date(order.deliverDate).toLocaleDateString() : 'N/A'} ${order.deliverTime || ''}<br/>
              <strong>Payment:</strong> ${order.paymentMethod}${order.paymentReceiver ? ` • Received By: ${order.paymentReceiver.firstName} ${order.paymentReceiver.lastName}` : ''}
            </div>
            <div class="services">
              <table>
                <thead><tr><th>Service</th><th>Qty</th><th class="right">Subtotal</th></tr></thead>
                <tbody>
                  ${(order.services || []).map(s => `<tr><td>${s.service.name}</td><td>${s.quantity} ${s.service.unit || ''}</td><td class="right">₱${s.subtotal.toFixed(2)}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
            <div style="margin-top:12px; text-align:right; font-weight:bold">Total: ₱${order.totalAmount.toFixed(2)}</div>
            <script>window.print();</script>
          </body>
        </html>
      `
      const w = window.open('', '_blank')
      if (!w) return
      w.document.open()
      w.document.write(html)
      w.document.close()
    } catch (err) {
      console.error('Fallback print window failed', err)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <ClientSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <ClientNavbar toggleSidebar={toggleSidebar} />
      <div className="lg:ml-64 pt-20 md:pt-32 p-4 md:p-8 mt-4 md:mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Receipts</h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : orders.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-12">
                <Package className="w-16 h-16 text-base-content/30 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Receipts</h2>
                <p className="text-base-content/60 mb-4">You have no completed orders yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map(order => (
                <div key={order._id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                        <div className="text-sm text-base-content/70">{order.deliverDate ? new Date(order.deliverDate).toLocaleDateString() : 'N/A'} • {order.deliverTime || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-base-content/60">Total</div>
                        <div className="text-primary font-bold">₱{order.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-base-content/80">
                      {order.paymentReceiver ? (
                        <div>Received By: <span className="font-medium">{order.paymentReceiver.firstName} {order.paymentReceiver.lastName}</span></div>
                      ) : (
                        <div>Payment: <span className="font-medium">{order.paymentMethod}</span></div>
                      )}
                    </div>
                    <div className="card-actions justify-end mt-4 gap-2">
                        <button onClick={() => handleDownloadReceipt(order)} className="btn btn-sm btn-outline btn-primary">Download</button>
                      <button onClick={() => setSelectedOrder(order)} className="btn btn-sm btn-primary">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="lg:ml-64 pt-6 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-base-100 shadow-lg rounded-lg p-6 print:bg-base-100 print:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Laundry Planet</h2>
                  <div className="text-sm text-base-content/60">Receipt • {selectedOrder.orderNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm">Time: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-semibold">Bill To</h4>
                  <div className="text-sm">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</div>
                  <div className="text-sm">{selectedOrder.customer?.email}</div>
                  <div className="text-sm">{selectedOrder.contactPhone}</div>
                </div>
                <div>
                  <h4 className="font-semibold">Delivery & Payment</h4>
                  <div className="text-sm">{selectedOrder.deliverDate ? new Date(selectedOrder.deliverDate).toLocaleDateString() : 'N/A'}</div>
                  <div className="text-sm">{selectedOrder.deliverTime || 'N/A'}</div>
                  <div className="text-sm">
                    Payment: <span className="capitalize">{selectedOrder.paymentMethod}</span>
                    {selectedOrder.paymentStatus === 'paid' && (
                      <span className="badge badge-success badge-xs ml-2">Paid</span>
                    )}
                  </div>
                  {selectedOrder.paymentMethod === 'gcash' && selectedOrder.paymentDetails?.gcashReferenceNumber && (
                    <div className="text-sm text-info">
                      GCash Ref: {selectedOrder.paymentDetails.gcashReferenceNumber}
                    </div>
                  )}
                  {selectedOrder.paymentDetails?.paidAt && (
                    <div className="text-sm text-success">
                      Paid on: {new Date(selectedOrder.paymentDetails.paidAt).toLocaleDateString()} at {new Date(selectedOrder.paymentDetails.paidAt).toLocaleTimeString()}
                    </div>
                  )}
                  {selectedOrder.paymentReceiver && (
                    <div className="text-sm">Received By: {selectedOrder.paymentReceiver.firstName} {selectedOrder.paymentReceiver.lastName}</div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Service</th>
                      <th className="text-left">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.services || []).map((s, idx) => (
                      <tr key={idx}>
                        <td>{s.service.name}</td>
                        <td>{s.quantity} {s.service.unit || ''}</td>
                        <td className="text-right">₱{s.service.price?.toFixed(2) || '0.00'}</td>
                        <td className="text-right">₱{s.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-4">
                <div className="w-full md:w-1/3">
                  <div className="flex justify-between py-1">
                    <span className="text-sm">Services Subtotal</span>
                    <span>₱{(selectedOrder.servicesSubtotal || selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm">Shipping Fee</span>
                    <span className={selectedOrder.shippingFee === 0 ? "text-success" : ""}>
                      {selectedOrder.shippingFee === 0 ? 'FREE' : `₱${(selectedOrder.shippingFee || 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between font-bold text-lg py-2">
                    <span>Total</span>
                    <span>₱{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <div className="text-sm text-base-content/60">Thank you for choosing Laundry Planet.</div>
                  <div className="flex gap-2">
                  <button onClick={() => handleDownloadReceipt(selectedOrder)} className="btn btn-sm btn-outline btn-primary">Download PDF</button>
                  <button onClick={printReceipt} className="btn btn-sm btn-primary">Print</button>
                  <button onClick={() => setSelectedOrder(null)} className="btn btn-sm">Back to list</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Receipts
