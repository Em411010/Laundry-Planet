import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClientSidebar, ClientNavbar } from '../components/navbars/ClientNavbar';
import { orderAPI, messageAPI, paymentAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import OrderChat from '../components/OrderChat';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin,
  MessageSquare,
  Eye,
  AlertCircle,
  User,
  Calendar,
  CreditCard,
  Loader
} from 'lucide-react';

const TrackOrders = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [payingOrder, setPayingOrder] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'client') {
        navigate('/login');
        return;
      }
      setUser(parsedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Setup real-time order updates
  useEffect(() => {
    if (isConnected && user) {
      // Listen for order status updates
      socket.onOrderStatusUpdate((data) => {
        console.log('Order status updated:', data);
        // Refresh orders list
        loadOrders();
        // If viewing this order in modal, update it
        if (selectedOrder && selectedOrder._id === data.orderId) {
          loadOrderDetails(data.orderId);
        }
      });

      // Listen for order updates
      socket.onOrderUpdate((data) => {
        console.log('Order updated:', data);
        loadOrders();
        if (selectedOrder && selectedOrder._id === data.order._id) {
          setSelectedOrder(data.order);
        }
      });

      // Listen for staff assignments
      socket.onStaffAssigned((data) => {
        console.log('Staff assigned:', data);
        loadOrders();
      });

      // Cleanup
      return () => {
        socket.removeAllListeners('order:statusUpdate');
        socket.removeAllListeners('order:update');
        socket.removeAllListeners('order:staffAssigned');
      };
    }
  }, [isConnected, user, selectedOrder]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getMyOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Check if order is ready for GCash payment
  const canPayNow = (order) => {
    return (
      order.paymentMethod === 'gcash' &&
      order.paymentStatus === 'unpaid' &&
      ['processed', 'for-delivery'].includes(order.status) &&
      !order.paymentDetails?.paymongoPaymentId
    );
  };

  // Handle GCash payment
  const handlePayNow = async (orderId) => {
    try {
      setPayingOrder(orderId);
      setPaymentError(null);
      
      const response = await paymentAPI.initiateGCashPayment(orderId);
      
      if (response.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        setPaymentError('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setPayingOrder(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      accepted: 'badge-info',
      'picked-up': 'badge-info',
      'in-progress': 'badge-primary',
      processed: 'badge-primary',
      'for-delivery': 'badge-accent',      'payment-received': 'badge-success',      delivered: 'badge-success',
      cancelled: 'badge-error'
    };
    return badges[status] || 'badge-ghost';
  };

  const getStatusDisplay = (status) => {
    const displays = {
      pending: 'Pending',
      accepted: 'Ready for Pickup',
      'picked-up': 'Picked Up',
      'in-progress': 'In Progress',
      processed: 'Processed',
      'for-delivery': 'Out for Delivery',
      'payment-received': 'Cash Payment Received',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return displays[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'accepted':
        return <Clock className="w-5 h-5" />;
      case 'picked-up':
      case 'in-progress':
      case 'processed':
        return <Package className="w-5 h-5" />;
      case 'for-delivery':
        return <Truck className="w-5 h-5" />;
      case 'payment-received':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const openOrderDetail = async (orderId) => {
    try {
      const response = await orderAPI.getOrderById(orderId);
      setSelectedOrder(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
  };

  const loadOrderDetails = async (orderId) => {
    try {
      const response = await orderAPI.getOrderById(orderId);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Failed to reload order details:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <ClientSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <ClientNavbar toggleSidebar={toggleSidebar} />

      <div className="lg:ml-64 pt-28 md:pt-32 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Track Orders</h1>
          </div>

          {paymentError && (
            <div className="alert alert-error mb-6">
              <AlertCircle className="w-5 h-5" />
              <span>{paymentError}</span>
              <button onClick={() => setPaymentError(null)} className="btn btn-sm btn-ghost">✕</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : orders.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-12">
                <Package className="w-16 h-16 text-base-content/30 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
                <p className="text-base-content/60 mb-4">
                  You haven't placed any orders yet.
                </p>
                <button 
                  onClick={() => navigate('/client/new-order')}
                  className="btn btn-primary"
                >
                  Place Your First Order
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="card-title text-lg">{order.orderNumber}</h2>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {getStatusDisplay(order.status)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(order.status)}
                        <span className="font-semibold">{getStatusDisplay(order.status)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <Calendar className="w-4 h-4" />
                        <span>Delivery: {order.deliverDate ? new Date(order.deliverDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <Clock className="w-4 h-4" />
                        <span>{order.deliverTime || 'N/A'}</span>
                      </div>

                      {order.actualWeight && (
                        <div className="flex items-center gap-2 text-sm text-base-content/70">
                          <Package className="w-4 h-4" />
                          <span>{order.actualWeight} kg</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60">Total:</span>
                        <span className="font-bold text-primary text-lg">
                          ₱{order.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      {order.paymentMethod === 'gcash' && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="w-4 h-4" />
                          <span className={`badge badge-sm ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                            {order.paymentStatus === 'paid' ? 'GCash Paid' : 'GCash - Pending Payment'}
                          </span>
                        </div>
                      )}
                    </div>

                    {canPayNow(order) && (
                      <div className="mt-3">
                        <button
                          onClick={() => handlePayNow(order._id)}
                          disabled={payingOrder === order._id}
                          className="btn btn-success btn-sm w-full gap-2"
                        >
                          {payingOrder === order._id ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              Pay Now via GCash
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4 gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setChatOpen(true);
                        }}
                        className="btn btn-sm btn-outline gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </button>
                      <button
                        onClick={() => openOrderDetail(order._id)}
                        className="btn btn-sm btn-primary gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-2xl mb-4">
              Order Details - {selectedOrder.orderNumber}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-bold mb-2">Status</h4>
                  <span className={`badge ${getStatusBadge(selectedOrder.status)} badge-lg`}>
                    {getStatusDisplay(selectedOrder.status)}
                  </span>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="font-bold mb-2">Order Date</h4>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-base-content/60">
                    {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 mb-4">
              <div className="card-body">
                <h4 className="font-bold flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5" />
                  Pickup Address
                </h4>
                <p className="mb-3">{selectedOrder.pickupAddress.fullAddress}</p>
                {selectedOrder.pickupAddress.location?.coordinates[0] !== 0 && (
                  <div className="space-y-2">
                    <iframe
                      width="100%"
                      height="200"
                      style={{border: 0, borderRadius: '0.5rem'}}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedOrder.pickupAddress.location.coordinates[1]},${selectedOrder.pickupAddress.location.coordinates[0]}&zoom=15`}
                    ></iframe>
                    <a
                      href={`https://www.google.com/maps?q=${selectedOrder.pickupAddress.location.coordinates[1]},${selectedOrder.pickupAddress.location.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline gap-2 w-full"
                    >
                      <MapPin className="h-4 w-4" />
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-base-200 mb-4">
              <div className="card-body">
                <h4 className="font-bold flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5" />
                  Services
                </h4>
                <div className="space-y-2">
                  {selectedOrder.services.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-base-100 p-2 rounded">
                      <div className="flex flex-col">
                        <span className="font-medium">{s.service.name}</span>
                        <span className="text-xs text-base-content/60">
                          ₱{s.service.price.toFixed(2)} per {s.service.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{s.quantity} {s.service.unit}</span>
                        <span className="font-semibold">₱{s.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="divider my-2"></div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Services Subtotal:</span>
                    <span>₱{(selectedOrder.servicesSubtotal || selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Shipping Fee:</span>
                    <span className={selectedOrder.shippingFee === 0 ? "text-success font-medium" : ""}>
                      {selectedOrder.shippingFee === 0 ? 'FREE' : `₱${(selectedOrder.shippingFee || 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">₱{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 mb-4">
              <div className="card-body">
                <h4 className="font-bold mb-2">Pickup & Delivery Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Pickup Date:</span> {new Date(selectedOrder.pickupDate).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Pickup Time:</span> {selectedOrder.pickupTime}</p>
                  <p><span className="font-semibold text-accent">Delivery Date:</span> {selectedOrder.deliverDate ? new Date(selectedOrder.deliverDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-semibold text-accent">Delivery Time:</span> {selectedOrder.deliverTime || 'N/A'}</p>
                  <p>
                    <span className="font-semibold">Payment:</span> {selectedOrder.paymentMethod.toUpperCase()}
                    <span className={`ml-2 badge badge-sm ${selectedOrder.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {selectedOrder.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </p>
                  {selectedOrder.paymentDetails?.gcashReferenceNumber && (
                    <p><span className="font-semibold">GCash Ref:</span> {selectedOrder.paymentDetails.gcashReferenceNumber}</p>
                  )}
                  {selectedOrder.paymentDetails?.paidAt && (
                    <p><span className="font-semibold">Paid At:</span> {new Date(selectedOrder.paymentDetails.paidAt).toLocaleString()}</p>
                  )}
                  {selectedOrder.actualWeight && (
                    <p><span className="font-semibold">Weight:</span> {selectedOrder.actualWeight} kg</p>
                  )}
                </div>

                {canPayNow(selectedOrder) && (
                  <div className="mt-4">
                    <button
                      onClick={() => handlePayNow(selectedOrder._id)}
                      disabled={payingOrder === selectedOrder._id}
                      className="btn btn-success w-full gap-2"
                    >
                      {payingOrder === selectedOrder._id ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Pay ₱{selectedOrder.totalAmount.toFixed(2)} via GCash
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {(selectedOrder.assignedStaff?.pickup || selectedOrder.assignedStaff?.processing || selectedOrder.assignedStaff?.delivery) && (
              <div className="card bg-base-200 mb-4">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2 mb-3">
                    <User className="h-5 w-5" />
                    Assigned Staff
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.assignedStaff?.pickup && (
                      <p>
                        <span className="font-semibold">Pickup:</span>{' '}
                        {selectedOrder.assignedStaff.pickup.firstName} {selectedOrder.assignedStaff.pickup.lastName}
                      </p>
                    )}
                    {selectedOrder.assignedStaff?.processing && (
                      <p>
                        <span className="font-semibold">Processing:</span>{' '}
                        {selectedOrder.assignedStaff.processing.firstName} {selectedOrder.assignedStaff.processing.lastName}
                      </p>
                    )}
                    {selectedOrder.assignedStaff?.delivery && (
                      <p>
                        <span className="font-semibold">Delivery:</span>{' '}
                        {selectedOrder.assignedStaff.delivery.firstName} {selectedOrder.assignedStaff.delivery.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="card bg-base-200 mb-4">
                <div className="card-body">
                  <h4 className="font-bold flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5" />
                    Status History
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(history.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${getStatusBadge(history.status)} badge-sm`}>
                              {getStatusDisplay(history.status)}
                            </span>
                            {(history.updatedByName || history.changedBy) && (
                              <span className="text-xs text-base-content/60">
                                by {history.updatedByName || (history.changedBy && `${history.changedBy.firstName} ${history.changedBy.lastName}`)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/70">
                            {new Date(history.updatedAt || history.timestamp).toLocaleDateString()} at{' '}
                            {new Date(history.updatedAt || history.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button
                onClick={() => {
                  setChatOpen(true);
                }}
                className="btn btn-outline gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                Open Chat
              </button>
              <button onClick={() => setShowModal(false)} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderChat
          orderId={selectedOrder._id}
          currentUser={user}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};

export default TrackOrders;


