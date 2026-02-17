import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Logo from '../../assets/LP_Logo.png'
import {
  Home,
  BadgeDollarSign,
  Info,
  Phone,
  LogIn,
  UserPlus,
  Sun,
  Moon
} from 'lucide-react'

const LandingNavbar = () => {
  const [theme, setTheme] = useState('corporate')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const initial = saved || 'corporate'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    document.body && document.body.setAttribute('data-theme', initial)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'aqua' ? 'corporate' : 'aqua'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.body && document.body.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  const toggleMenu = () => setOpen((v) => !v)

  const scrollToSection = (sectionId) => {
    // If not on landing page, navigate there first
    if (location.pathname !== '/landing') {
      navigate('/landing')
      // Wait for navigation to complete then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } else {
      // Already on landing page, just scroll
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    setOpen(false)
  }

  const handleHomeClick = (e) => {
    e.preventDefault()
    scrollToSection('home')
  }

  const handleServicesClick = (e) => {
    e.preventDefault()
    scrollToSection('services')
  }

  const handleContactClick = (e) => {
    e.preventDefault()
    scrollToSection('contact')
  }

  return (
    <div className="navbar bg-base-100 shadow sticky top-0 z-50">

      <div className="navbar-start px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="Laundry Planet" className="h-10 w-10 rounded" />
          <Link to="/landing" className="font-bold text-lg">Laundry Planet</Link>
        </div>
      </div>

    
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal gap-1">
          <li><a href="#home" onClick={handleHomeClick} className="flex items-center gap-2"><Home className="h-4 w-4" /><span>Home</span></a></li>
          <li><a href="#services" onClick={handleServicesClick} className="flex items-center gap-2"><BadgeDollarSign className="h-4 w-4" /><span>Services & Pricing</span></a></li>
          <li><Link to="/how-it-works" className="flex items-center gap-2"><Info className="h-4 w-4" /><span>How It Works</span></Link></li>
          <li><a href="#contact" onClick={handleContactClick} className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>Contact Us</span></a></li>
        </ul>
      </div>

     
      <div className="navbar-end gap-2 px-2 sm:px-4">
        <div className="dropdown dropdown-end lg:hidden">
          <button
            className="btn btn-ghost"
            aria-label="Toggle navigation"
            onClick={toggleMenu}
          >
            <span className="sr-only">Open menu</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          {open && (
            <ul className="dropdown-content menu bg-base-100 rounded-box w-60 p-2 shadow">
              <li><a href="#home" onClick={handleHomeClick}><Home className="h-4 w-4" /> Home</a></li>
              <li><a href="#services" onClick={handleServicesClick}><BadgeDollarSign className="h-4 w-4" /> Services & Pricing</a></li>
              <li><Link to="/how-it-works" onClick={() => setOpen(false)}><Info className="h-4 w-4" /> How It Works</Link></li>
              <li><a href="#contact" onClick={handleContactClick}><Phone className="h-4 w-4" /> Contact Us</a></li>
              <li className="mt-2"><Link to="/login" className="btn btn-ghost" onClick={() => setOpen(false)}><LogIn className="h-4 w-4" /> Login</Link></li>
              <li><Link to="/register" className="btn btn-primary" onClick={() => setOpen(false)}><UserPlus className="h-4 w-4" /> Register</Link></li>
              <li>
                <button className="btn btn-ghost" onClick={() => { toggleTheme(); setOpen(false); }}>
                  {theme === 'aqua' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="ml-2">Toggle Theme</span>
                </button>
              </li>
            </ul>
          )}
        </div>

        <button aria-label="Toggle theme" className="btn btn-ghost hidden md:inline-flex" onClick={toggleTheme}>
          {theme === 'aqua' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Link to="/login" className="btn btn-ghost hidden md:inline-flex">
          <LogIn className="h-4 w-4" />
          <span className="ml-1">Login</span>
        </Link>
        <Link to="/register" className="btn btn-primary hidden md:inline-flex">
          <UserPlus className="h-4 w-4" />
          <span className="ml-1">Register</span>
        </Link>
      </div>
    </div>
  )
}

export default LandingNavbar
