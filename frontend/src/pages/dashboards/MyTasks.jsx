import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, AlertCircle, Weight, Camera, MessageSquare, ChevronRight } from 'lucide-react';
import { StaffSidebar, StaffNavbar } from '../../components/navbars/StaffNavbar';
import { orderAPI } from '../../services/api';

const MyTasks = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [serviceWeights, setServiceWeights] = useState({});
  const [imageUrl, setImageUrl] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'staff') {
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
      fetchMyTasks();
    }
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getStaffTasks();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'To Be Pickup',
      'picked-up': 'Picked Up - On the Store',
      'in-progress': 'On Going Services',
      'processed': 'Services Done',
      'for-delivery': 'To Be Deliver',
      'delivered': 'Completed'
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-warning',
      'accepted': 'badge-info',
      'picked-up': 'badge-primary',
      'in-progress': 'badge-secondary',
      'processed': 'badge-accent',
      'for-delivery': 'badge-accent',
      'delivered': 'badge-success'
    };
    return badges[status] || 'badge-ghost';
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'accepted': 'picked-up',
      'picked-up': 'in-progress',
      'in-progress': 'processed',
      'processed': 'for-delivery',
      'for-delivery': 'delivered'
    };
    return statusFlow[currentStatus];
  };

  const filterOrders = () => {
    if (!user) return [];
    
    if (activeTab === 'pending') {
      // Show all tasks where the staff is assigned and order is not yet delivered
      return orders.filter(order => {
        const userId = user._id || user.id;
        
        // Don't show delivered orders in pending
        if (order.status === 'delivered') {
          return false;
        }
        
        // Show order if user is assigned to any stage
        return (
          order.assignedStaff?.pickup?._id === userId ||
          order.assignedStaff?.processing?._id === userId ||
          order.assignedStaff?.delivery?._id === userId
        );
      });
    } else if (activeTab === 'completed') {
      // Show tasks where the staff was assigned and order is delivered
      return orders.filter(order => {
        const userId = user._id || user.id;
        
        // Only show as completed when order is actually delivered
        if (order.status !== 'delivered') {
          return false;
        }
        
        // Check if user was assigned to any stage of this order
        return (
          order.assignedStaff?.pickup?._id === userId ||
          order.assignedStaff?.processing?._id === userId ||
          order.assignedStaff?.delivery?._id === userId
        );
      });
    }
    return orders;
  };

  const openOrderDetail = async (orderId) => {
    try {
      const response = await orderAPI.getOrderById(orderId);
      const order = response.data;
      setSelectedOrder(order);
      
      // Initialize service weights from existing quantities
      const weights = {};
      order.services.forEach((service, idx) => {
        weights[idx] = service.quantity || '';
      });
      setServiceWeights(weights);
      
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleUpdateWeight = async () => {
    // Validate all services have weights
    const allWeightsEntered = selectedOrder.services.every((_, idx) => {
      const weight = serviceWeights[idx];
      return weight && parseFloat(weight) > 0;
    });

    if (!allWeightsEntered) {
      alert('Please enter weight for all services');
      return;
    }

    try {
      // Calculate total weight
      const totalWeight = selectedOrder.services.reduce((sum, _, idx) => {
        return sum + parseFloat(serviceWeights[idx] || 0);
      }, 0);

      await orderAPI.updateOrderWeight(selectedOrder._id, {
        weight: totalWeight,
        services: selectedOrder.services.map((s, idx) => ({
          serviceId: s.service._id,
          quantity: parseFloat(serviceWeights[idx])
        }))
      });
      
      alert('Weights updated successfully');
      await fetchMyTasks();
      
      // Refresh order details
      const response = await orderAPI.getOrderById(selectedOrder._id);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error updating weight:', error);
      alert('Failed to update weights');
    }
  };

  const handleAdvanceStatus = async () => {
    const nextStatus = getNextStatus(selectedOrder.status);
    
    if (!nextStatus) {
      alert('This order is already at the final stage');
      return;
    }

    // Check weight requirement for accepted -> picked-up
    if (selectedOrder.status === 'accepted') {
      const allWeightsEntered = selectedOrder.services.every(s => s.quantity > 0);
      if (!allWeightsEntered) {
        alert('Please weigh all services before marking as picked up');
        return;
      }
    }

    try {
      await orderAPI.updateOrderStatus(selectedOrder._id, nextStatus);
      alert(`Order advanced to ${getStatusDisplay(nextStatus)}`);
      await fetchMyTasks();
      setShowModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error advancing order status:', error);
      alert(error.response?.data?.message || 'Failed to advance order status');
    }
  };

  const handleAddImage = async () => {
    if (!imageUrl.trim()) {
      alert('Please enter an image URL');
      return;
    }

    try {
      await orderAPI.addOrderImage(selectedOrder._id, {
        url: imageUrl,
        description: imageDescription
      });
      
      alert('Image added successfully');
      setImageUrl('');
      setImageDescription('');
      
      // Refresh order details
      const response = await orderAPI.getOrderById(selectedOrder._id);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Failed to add image');
    }
  };

  const handleAddMessage = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      await orderAPI.addOrderMessage(selectedOrder._id, { message });
      
      alert('Message added successfully');
      setMessage('');
      
      // Refresh order details
      const response = await orderAPI.getOrderById(selectedOrder._id);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to add message');
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-base-200 overflow-x-hidden">
        <StaffSidebar user={user} isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <StaffNavbar toggleSidebar={toggleSidebar} />
      
      <div className="lg:ml-64 pt-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto"><div className="mb-6 mt-10">
            <h1 className="text-3xl font-bold text-base-content flex items-center gap-2">
              <Clock className="w-8 h-8 text-primary" />
              My Tasks
            </h1>
            <p className="text-base-content/60 mt-2">
              Manage your assigned orders and tasks
            </p>
          </div><div className="tabs tabs-boxed mb-6">
              <button
                className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </button>
              <button
                className={`tab ${activeTab === 'completed' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed
              </button>
            </div>{loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterOrders().map((order) => (
                  <div
                    key={order._id}
                    className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                    onClick={() => openOrderDetail(order._id)}
                  >
                    <div className="card-body">
                      <div className="flex justify-between items-start">
                        <h2 className="card-title text-lg">
                          {order.orderNumber}
                        </h2>
                        <span className={`badge ${getStatusBadge(order.status)}`}>
                          {getStatusDisplay(order.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-base-content/60" />
                          <span className="text-base-content/80">
                            {order.customer.firstName} {order.customer.lastName}
                          </span>
                        </div>
                        
                        {order.actualWeight && (
                          <div className="flex items-center gap-2 text-sm">
                            <Weight className="w-4 h-4 text-base-content/60" />
                            <span className="text-base-content/80">
                              {order.actualWeight} kg
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-base-content/60">Amount:</span>
                          <span className="font-semibold text-primary">
                            ₱{order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="card-actions justify-end mt-4">
                        <button className="btn btn-primary btn-sm">
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filterOrders().length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <AlertCircle className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                    <p className="text-base-content/60">
                      No {activeTab} tasks found
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
      </div>{showModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-2xl mb-4">
              Order Details - {selectedOrder.orderNumber}
            </h3><div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Status</span>
                </label>
                <span className={`badge ${getStatusBadge(selectedOrder.status)} badge-lg`}>
                  {getStatusDisplay(selectedOrder.status)}
                </span>
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Customer</span>
                </label>
                <p className="text-base-content">
                  {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                </p>
                <p className="text-sm text-base-content/60">{selectedOrder.customer.email}</p>
              </div>
            </div>{selectedOrder.status === 'accepted' && (
              <div className="alert alert-warning mb-4">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-bold">Action Required: Weight Input</p>
                  <p className="text-sm">You must weigh each service before you can mark this order as picked up.</p>
                </div>
              </div>
            )}<div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">Services & Weights</span>
              </label>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Category</th>
                      <th>Weight (kg)</th>
                      <th>Price/kg</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.services.map((service, idx) => (
                      <tr key={idx}>
                        <td>{service.service.name}</td>
                        <td>
                          <span className="badge badge-outline">
                            {service.service.category}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="input input-bordered input-sm w-24"
                            placeholder="0.0"
                            value={serviceWeights[idx] || ''}
                            onChange={(e) => setServiceWeights(prev => ({
                              ...prev,
                              [idx]: e.target.value
                            }))}
                            step="0.1"
                            min="0"
                            disabled={['in-progress', 'processed', 'for-delivery', 'delivered'].includes(selectedOrder.status)}
                          />
                        </td>
                        <td>₱{service.price.toFixed(2)}</td>
                        <td className="font-semibold">
                          ₱{(service.price * (parseFloat(serviceWeights[idx]) || service.quantity || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td colSpan="2" className="text-right">Total Weight:</td>
                      <td>
                        {selectedOrder.services.reduce((sum, _, idx) => 
                          sum + parseFloat(serviceWeights[idx] || 0), 0
                        ).toFixed(2)} kg
                      </td>
                      <td className="text-right">Total:</td>
                      <td>
                        ₱{selectedOrder.services.reduce((sum, service, idx) => 
                          sum + (service.price * (parseFloat(serviceWeights[idx]) || service.quantity || 0)), 0
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-2 items-center">
                {!['in-progress', 'processed', 'for-delivery', 'delivered'].includes(selectedOrder.status) && (
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateWeight}
                  >
                    <Weight className="w-4 h-4 mr-2" />
                    Update All Weights
                  </button>
                )}
                {selectedOrder.status === 'accepted' && (
                  <span className="text-sm text-base-content/60">
                    Step 1: Update weights, then Step 2: Mark as Picked Up
                  </span>
                )}
              </div>
            </div><div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">Delivery Address</span>
              </label>
              <p className="text-base-content">
                {selectedOrder.customAddress || selectedOrder.address}
              </p>
            </div><div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">Images</span>
              </label>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  placeholder="Description (optional)"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddImage}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add Image
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedOrder.images?.map((image, idx) => (
                  <div key={idx} className="card bg-base-200">
                    <figure className="px-4 pt-4">
                      <img
                        src={image.url}
                        alt={image.description}
                        className="rounded-lg h-32 w-full object-cover"
                      />
                    </figure>
                    <div className="card-body p-4">
                      <p className="text-sm text-base-content/80">
                        {image.description}
                      </p>
                      <p className="text-xs text-base-content/60">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div><div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">Messages</span>
              </label>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  placeholder="Enter message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddMessage}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedOrder.messages?.map((msg, idx) => (
                  <div key={idx} className="chat chat-start">
                    <div className="chat-bubble">
                      <p>{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div><div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                  setServiceWeights({});
                  setImageUrl('');
                  setImageDescription('');
                  setMessage('');
                }}
              >
                Close
              </button>{(() => {
                const userId = user?._id || user?.id;
                const isPickupStaff = selectedOrder?.assignedStaff?.pickup?._id === userId;
                const isProcessingStaff = selectedOrder?.assignedStaff?.processing?._id === userId;
                const isDeliveryStaff = selectedOrder?.assignedStaff?.delivery?._id === userId;
                
                // Show button only if assigned to current stage
                const canAdvance = 
                  (selectedOrder?.status === 'accepted' && isPickupStaff) ||
                  (selectedOrder?.status === 'picked-up' && isProcessingStaff) ||
                  (selectedOrder?.status === 'in-progress' && isProcessingStaff) ||
                  (selectedOrder?.status === 'processed' && isDeliveryStaff) ||
                  (selectedOrder?.status === 'for-delivery' && isDeliveryStaff);
                
                if (!canAdvance) return null;
                
                return (
                  <button
                    className={`btn btn-primary ${
                      selectedOrder.status === 'accepted' && 
                      !selectedOrder.services.every(s => s.quantity > 0) 
                        ? 'btn-disabled' 
                        : ''
                    }`}
                    onClick={handleAdvanceStatus}
                    disabled={
                      selectedOrder.status === 'accepted' && 
                      !selectedOrder.services.every(s => s.quantity > 0)
                    }
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {selectedOrder.status === 'accepted' && 'Mark as Picked Up'}
                    {selectedOrder.status === 'picked-up' && 'Start Services'}
                    {selectedOrder.status === 'in-progress' && 'Mark as Done'}
                    {selectedOrder.status === 'processed' && 'Ready for Delivery'}
                    {selectedOrder.status === 'for-delivery' && 'Mark as Delivered'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyTasks;
