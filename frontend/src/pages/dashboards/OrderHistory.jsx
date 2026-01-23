import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { ClientSidebar, ClientNavbar } from '../../components/navbars/ClientNavbar';
import { orderAPI } from '../../services/api';
import { Package, CheckCircle, Eye, Calendar, Clock } from 'lucide-react';

const OrderHistory = () => {
    // PDF receipt generation (now inside component to access selectedOrder)
    const handleDownloadReceipt = () => {
      if (!selectedOrder) return;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Laundry Planet - Order Receipt', 10, 15);
      doc.setFontSize(12);
      doc.text(`Order Number: ${selectedOrder.orderNumber}`, 10, 30);
      doc.text(`Customer: ${selectedOrder.customer?.firstName || ''} ${selectedOrder.customer?.lastName || ''}`, 10, 38);
      doc.text(`Delivery Date: ${selectedOrder.deliverDate ? new Date(selectedOrder.deliverDate).toLocaleDateString() : 'N/A'}`, 10, 46);
      doc.text(`Delivery Time: ${selectedOrder.deliverTime || 'N/A'}`, 10, 54);
      doc.text(`Payment Method: ${selectedOrder.paymentMethod}`, 10, 62);
      if (selectedOrder.paymentReceiver) {
        doc.text(`Received By: ${selectedOrder.paymentReceiver.firstName} ${selectedOrder.paymentReceiver.lastName}`, 10, 70);
      }
      doc.text('Services:', 10, 82);
      let y = 90;
      selectedOrder.services.forEach((s, idx) => {
        doc.text(
          `${s.service.name} - ${s.quantity} ${s.service.unit} x ₱${s.service.price.toFixed(2)} = ₱${s.subtotal.toFixed(2)}`,
          12,
          y
        );
        y += 8;
      });
      doc.text(`Total: ₱${selectedOrder.totalAmount.toFixed(2)}`, 10, y + 6);
      doc.save(`Receipt_${selectedOrder.orderNumber}.pdf`);
    };
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getMyOrders();
      // Only show delivered orders
      setOrders((response.data || []).filter(order => order.status === 'delivered'));
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-base-200 overflow-x-hidden">
      <ClientSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <ClientNavbar toggleSidebar={toggleSidebar} />
      <div className="lg:ml-64 pt-20 p-4 md:p-8 mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Order History</h1>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : orders.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-12">
                <Package className="w-16 h-16 text-base-content/30 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Completed Orders</h2>
                <p className="text-base-content/60 mb-4">
                  You have not completed any orders yet.
                </p>
                <button 
                  onClick={() => navigate('/client/new-order')}
                  className="btn btn-primary"
                >
                  Place an Order
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
                      <span className="badge badge-success">Completed</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="font-semibold">Delivered</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <Calendar className="w-4 h-4" />
                        <span>{order.deliverDate ? new Date(order.deliverDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <Clock className="w-4 h-4" />
                        <span>{order.deliverTime || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60">Total:</span>
                        <span className="font-bold text-primary text-lg">
                          ₱{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-4 gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
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
      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-2xl mb-4">
              Order Details - {selectedOrder.orderNumber}
            </h3>
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
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">₱{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card bg-base-200 mb-4">
              <div className="card-body">
                <h4 className="font-bold mb-2">Delivery Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Delivery Date:</span> {selectedOrder.deliverDate ? new Date(selectedOrder.deliverDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-semibold">Delivery Time:</span> {selectedOrder.deliverTime || 'N/A'}</p>
                  <p><span className="font-semibold">Payment:</span> {selectedOrder.paymentMethod}</p>
                  {selectedOrder.paymentReceiver && (
                    <p><span className="font-semibold">Received By:</span> {selectedOrder.paymentReceiver.firstName} {selectedOrder.paymentReceiver.lastName}</p>
                  )}
                  {selectedOrder.actualWeight && (
                    <p><span className="font-semibold">Weight:</span> {selectedOrder.actualWeight} kg</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-action flex gap-2">
              <button onClick={handleDownloadReceipt} className="btn btn-outline btn-primary">
                Download PDF Receipt
              </button>
              <button onClick={() => setShowModal(false)} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
