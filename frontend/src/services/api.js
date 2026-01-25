import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  // Login
  login: async ({ email, password }) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Verify OTP
  verifyOTP: async ({ email, otp }) => {
    const response = await api.post('/auth/verify-otp', { email, otp })
    return response.data
  },

  // Resend OTP
  resendOTP: async ({ email }) => {
    const response = await api.post('/auth/resend-otp', { email })
    return response.data
  },

  // Verify token
  verifyToken: async () => {
    const response = await api.get('/auth/verify')
    return response.data
  }
}

// User Management API (Admin only)
export const userAPI = {
  // Get all users
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  // Get single user
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Toggle user status
  toggleUserStatus: async (id) => {
    const response = await api.patch(`/users/${id}/toggle-status`)
    return response.data
  }
}

// Service Management API (Admin only)
export const serviceAPI = {
  // Get all services (Public)
  getAllServices: async () => {
    const response = await api.get('/services/public')
    return response.data
  },

  // Create service
  createService: async (serviceData) => {
    const response = await api.post('/services', serviceData)
    return response.data
  },

  // Update service
  updateService: async (id, serviceData) => {
    const response = await api.put(`/services/${id}`, serviceData)
    return response.data
  },

  // Delete service
  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`)
    return response.data
  },

  // Get single service by ID
  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`)
    return response.data
  },

  // Update service price
  updateServicePrice: async (id, price) => {
    const response = await api.patch(`/services/${id}/price`, { price })
    return response.data
  },

  // Toggle service active status
  toggleServiceStatus: async (id) => {
    const response = await api.patch(`/services/${id}/toggle-status`)
    return response.data
  },

  // Bulk update prices
  bulkUpdatePrices: async (updates) => {
    const response = await api.post('/services/bulk-update-prices', { updates })
    return response.data
  },

  // Get public services (no auth required)
  getPublicServices: async () => {
    const response = await api.get('/services/public')
    return response.data
  }
}

// Audit Logs API (Admin only)
export const auditAPI = {
  // Get all audit logs with filters
  getAllAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params })
    return response.data
  },

  // Get audit statistics
  getAuditStats: async () => {
    const response = await api.get('/audit-logs/stats')
    return response.data
  }
}

// Profile API (Authenticated users)
export const profileAPI = {
  // Get profile
  getProfile: async () => {
    const response = await api.get('/profile')
    return response.data
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData)
    return response.data
  },

  // Check if profile is complete
  checkProfileComplete: async () => {
    const response = await api.get('/profile/check-complete')
    return response.data
  }
}

// Order API (Authenticated users)
export const orderAPI = {
  // Create new order (Client only)
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  // Get all orders (role-based filtering)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  // Get my orders (Client)
  getMyOrders: async () => {
    const response = await api.get('/orders')
    return response.data
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  // Update order status (Admin/Staff)
  updateOrderStatus: async (id, status, note) => {
    const response = await api.patch(`/orders/${id}/status`, { status, note })
    return response.data
  },

  // Assign staff to order (Admin)
  assignStaff: async (id, staffId) => {
    const response = await api.patch(`/orders/${id}/assign`, { staffId })
    return response.data
  },

  // Cancel order
  cancelOrder: async (id, reason) => {
    const response = await api.patch(`/orders/${id}/cancel`, { reason })
    return response.data
  },

  // Get order statistics (Admin)
  getOrderStats: async () => {
    const response = await api.get('/orders/stats/overview')
    return response.data
  },

  // Accept order (Staff)
  acceptOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/accept`)
    return response.data
  },

  // Update order weight (Staff)
  updateOrderWeight: async (id, data) => {
    const response = await api.patch(`/orders/${id}/weight`, data)
    return response.data
  },

  // Modify order services (Pickup Staff)
  modifyOrderServices: async (id, services) => {
    const response = await api.patch(`/orders/${id}/services`, { services })
    return response.data
  },

  // Mark payment as received (Delivery Staff)
  markPaymentReceived: async (id) => {
    const response = await api.patch(`/orders/${id}/payment/received`)
    return response.data
  },

  // Add image to order (Staff)
  addOrderImage: async (id, url, description) => {
    const response = await api.post(`/orders/${id}/images`, { url, description })
    return response.data
  },

  // Get staff tasks
  getStaffTasks: async () => {
    const response = await api.get('/orders/staff/tasks')
    return response.data
  },

  // Get staff analytics
  getStaffAnalytics: async () => {
    const response = await api.get('/orders/staff/analytics')
    return response.data
  }
}

// Message API
export const messageAPI = {
  // Send a message
  sendMessage: async (orderId, content) => {
    const response = await api.post('/messages', { orderId, content })
    return response.data
  },

  // Get messages for an order
  getOrderMessages: async (orderId) => {
    const response = await api.get(`/messages/order/${orderId}`)
    return response.data
  },

  // Send a support message (admin chat)
  sendSupportMessage: async (content) => {
    const response = await api.post('/messages/support', { content })
    return response.data
  },

  // Get support messages (admin chat)
  getSupportMessages: async () => {
    const response = await api.get('/messages/support')
    return response.data
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count')
    return response.data
  }
}

// Dashboard API (Admin only)
export const dashboardAPI = {
  // Get admin dashboard statistics
  getAdminStats: async () => {
    const response = await api.get('/dashboard/admin/stats')
    return response.data
  }
}

export default api
