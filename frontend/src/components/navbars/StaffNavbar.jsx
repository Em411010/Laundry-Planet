import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, ClipboardList, 
  MessageSquare, Clock, CreditCard,
  LogOut, Menu, X, Sun, Moon
} from 'lucide-react'
import Logo from '../../assets/LP_Logo.png'

const StaffSidebar = ({ user, isOpen, toggleSidebar }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/staff' },
    { icon: ClipboardList, label: 'Orders', path: '/dashboard/staff/orders' },
    { icon: Clock, label: 'My Tasks', path: '/dashboard/staff/my-tasks' },
    { icon: CreditCard, label: 'Walk-in Order', path: '/dashboard/staff/payments' },
    { icon: MessageSquare, label: 'Messages', path: '/dashboard/staff/messages' }
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 h-screen w-64 bg-base-100 border-r border-base-300 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <div className="flex items-center gap-2">
              <img src={Logo} alt="LP" className="w-8 h-8 rounded" />
              <span className="font-bold text-lg">Staff Portal</span>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden btn btn-ghost btn-sm btn-square">
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-secondary text-secondary-content rounded-full w-10">
                  <span className="text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-base-content/60 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="menu menu-sm gap-1">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link to={item.path} className="flex items-center gap-2">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-base-300">
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

const StaffNavbar = ({ toggleSidebar }) => {
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
    <div className="fixed top-0 left-0 right-0 z-30 lg:left-64 lg:w-[calc(100%-16rem)]">
      <div className="navbar bg-base-100 border-b border-base-300 px-4">
        <div className="flex-1 min-w-0">
          <button onClick={toggleSidebar} className="btn btn-ghost btn-square lg:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-lg md:text-xl font-bold ml-2 truncate">Staff Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="btn btn-ghost btn-circle"
            aria-label="Toggle theme"
          >
            {theme === 'aqua' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="badge badge-secondary">STAFF</div>
        </div>
      </div>
    </div>
  )
}

export { StaffSidebar, StaffNavbar }
export default StaffNavbar
