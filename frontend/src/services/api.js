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
  // Get all services
  getAllServices: async () => {
    const response = await api.get('/services')
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

  // Add image to order (Staff)
  addOrderImage: async (id, url, description) => {
    const response = await api.post(`/orders/${id}/images`, { url, description })
    return response.data
  },

  // Add message to order (Staff/Client)
  addOrderMessage: async (id, message) => {
    const response = await api.post(`/orders/${id}/messages`, { message })
    return response.data
  },

  // Get staff tasks
  getStaffTasks: async () => {
    const response = await api.get('/orders/staff/tasks')
    return response.data
  }
}

export default api
