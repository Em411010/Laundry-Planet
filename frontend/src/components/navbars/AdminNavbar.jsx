import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Shield, Package, DollarSign, Tag, 
  Settings, FileText, CreditCard, BarChart3, FileSearch, 
  Database, Lock, LogOut, Menu, X, ChevronDown, Sun, Moon,
  MessageSquare, ShoppingCart
} from 'lucide-react'
import Logo from '../../assets/LP_Logo.png'

const AdminSidebar = ({ user, isOpen, toggleSidebar }) => {
  const navigate = useNavigate()
  const [openMenus, setOpenMenus] = useState({})

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const toggleSubmenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }))
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin' },
    { 
      icon: BarChart3, 
      label: 'Reports', 
      submenu: [
        { label: 'Sales Report', path: '/dashboard/admin/reports/sales' },
        { label: 'Customer Report', path: '/dashboard/admin/reports/customers' },
        { label: 'Service Report', path: '/dashboard/admin/reports/services' }
      ]
    },
    { 
      icon: ShoppingCart, 
      label: 'Walk-in Order', 
      path: '/dashboard/admin/walk-in-order' 
    },
    { icon: Users, label: 'User Management', path: '/dashboard/admin/users' },
    { icon: Package, label: 'Services & Pricing', path: '/dashboard/admin/services' },
    { 
      icon: MessageSquare, 
      label: 'Customer Support', 
      path: '/dashboard/admin/support' 
    },
    { 
      icon: FileText, 
      label: 'Orders', 
      path: '/dashboard/admin/orders' 
    },
  
  
    { 
      icon: FileSearch, 
      label: 'Audit Logs', 
      path: '/dashboard/admin/audit-logs' 
    }
  ]

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`fixed left-0 top-0 z-50 h-screen w-64 bg-base-100 border-r border-base-300 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <div className="flex items-center gap-2">
              <img src={Logo} alt="LP" className="w-8 h-8 rounded" />
              <span className="font-bold text-lg">Admin Portal</span>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden btn btn-ghost btn-sm btn-square">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-accent text-accent-content rounded-full w-10">
                  <span className="text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-base-content/60 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-0">
            <ul className="menu menu-sm gap-1">
              {menuItems.map((item, index) => (
                <li key={index}>
                  {item.submenu ? (
                    <>
                      <button 
                        onClick={() => toggleSubmenu(item.label)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform ${openMenus[item.label] ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {openMenus[item.label] && (
                        <ul>
                          {item.submenu.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <Link to={subItem.path}>{subItem.label}</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link to={item.path} className="flex items-center gap-2">
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-base-300 bg-base-100 sticky lg:relative bottom-0 left-0 right-0 shadow-lg lg:shadow-none z-10">
            <button onClick={handleLogout} className="btn btn-outline btn-error btn-sm w-full">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

const AdminNavbar = ({ toggleSidebar }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'corporate'
  })

  const toggleTheme = () => {
    const next = theme === 'aqua' ? 'corporate' : 'aqua'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.body?.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-30 lg:left-64 h-20">
      <div className="navbar bg-base-100 border-b border-base-300 px-4 h-full">
        <div className="flex-1 min-w-0">
          <button onClick={toggleSidebar} className="btn btn-ghost btn-square lg:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-lg md:text-xl font-bold ml-2 truncate">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="btn btn-ghost btn-circle"
            aria-label="Toggle theme"
          >
            {theme === 'aqua' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="badge badge-accent">ADMIN</div>
        </div>
      </div>
    </div>
  )
}

export { AdminSidebar, AdminNavbar }
export default AdminNavbar
