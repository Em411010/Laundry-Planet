import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, PlusCircle, Package, MapPin, Clock, 
  History, CreditCard, FileText, MessageSquare, User,
  LogOut, Menu, X, Bell, Sun, Moon, Truck
} from 'lucide-react'
import Logo from '../../assets/LP_Logo.png'

const ClientSidebar = ({ user, isOpen, toggleSidebar }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/client', desc: 'View all orders & tracking' },
    { icon: PlusCircle, label: 'New Order', path: '/dashboard/client/new-order', desc: 'Book new pickup' },
    { icon: Truck, label: 'Track Order', path: '/dashboard/client?tab=active', desc: 'Real-time tracking' },
    { icon: History, label: 'Order History', path: '/dashboard/client?tab=completed', desc: 'Past orders' },
    { icon: FileText, label: 'Receipts', path: '/dashboard/client/receipts', desc: 'Download receipts' },
    { icon: MessageSquare, label: 'Support Chat', path: '/dashboard/client/support', desc: 'Message staff' },
    { icon: User, label: 'My Profile', path: '/dashboard/client/profile', desc: 'Profile settings' }
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
              <span className="font-bold text-lg">Laundry Planet</span>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden btn btn-ghost btn-sm btn-square">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10">
                  <span className="text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-base-content/60 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <Link to="/dashboard/client/new-order" className="btn btn-primary btn-sm w-full gap-2">
              <PlusCircle size={16} />
              New Order
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 pb-4">
            <ul className="menu menu-sm gap-1">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link to={item.path} className="flex items-center gap-2 relative group">
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    <span className="absolute left-12 bottom-full mb-2 px-2 py-1 bg-base-300 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">{item.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

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

const ClientNavbar = ({ toggleSidebar }) => {
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
          <h1 className="text-lg md:text-xl font-bold ml-2 truncate">My Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="btn btn-ghost btn-circle"
            aria-label="Toggle theme"
          >
            {theme === 'aqua' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="btn btn-ghost btn-circle">
            <div className="indicator">
              <Bell size={20} />
              <span className="badge badge-xs badge-primary indicator-item"></span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export { ClientSidebar, ClientNavbar }
