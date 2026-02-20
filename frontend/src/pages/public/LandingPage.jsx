import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LandingNavbar from '../../components/navbars/LandingNavbar.jsx'
import { serviceAPI } from '../../services/api'
import { 
  Rocket, Shirt, Droplets, WashingMachine, 
  CalendarClock, Sun, PackageCheck,
  HandPlatter, Package, Truck,
  SatelliteDish, Bell, CreditCard, Star, Shield, Leaf,
  Recycle, MapPin, Phone, Mail, Clock,
  Facebook, Instagram, Twitter
} from 'lucide-react'

// Hero Section
const Hero = () => {
  return (
    <section className="grid gap-6 sm:gap-8 md:grid-cols-2 items-center">
      
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Welcome to Laundry Planet</h1>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary mb-2">Booking & Sales System</h2>
        <p className="text-sm sm:text-base text-base-content/70">
          Where your clothes get world-class care. Fast, reliable, and eco-friendly services with real-time tracking,
          pickup & delivery, and cashless payments.
        </p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <a href="#services" className="btn btn-primary btn-wide sm:btn-normal">View Our Services</a>
          <Link to="/register" className="btn btn-secondary btn-wide sm:btn-normal">Get Started</Link>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative h-56 w-56 sm:h-64 sm:w-64 md:h-80 md:w-80 shadow-2xl rounded-full">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-sm" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin [animation-duration:12s]" />
          <div className="absolute inset-6 rounded-full border border-primary/20 animate-spin [animation-duration:18s] [animation-direction:reverse]" />
          <div className="absolute inset-12 rounded-full bg-base-100 shadow-xl grid place-items-center">
            <WashingMachine className="h-24 w-20 text-primary" />
          </div><div className="orbit-center" style={{ transform: 'translate(-50%, -50%) rotate(0deg)' }}>
            <Shirt className="h-6 w-6 text-secondary orbit-item orbit-top" />
          </div>
          <div className="orbit-center" style={{ transform: 'translate(-50%, -50%) rotate(60deg)' }}>
            <Droplets className="h-6 w-6 text-info orbit-item orbit-left" />
          </div>
          <div className="orbit-center" style={{ transform: 'translate(-50%, -50%) rotate(200deg)' }}>
            <Rocket className="h-6 w-6 text-accent orbit-item orbit-bottom" />
          </div>
        </div>
      </div>
    </section>
  )
}

// How It Works Section
const HowItWorks = () => {
  const steps = [
    { icon: CalendarClock, title: 'Drop Off / Pickup', desc: 'Schedule pickup or visit a branch.' },
    { icon: Droplets, title: 'Wash & Care', desc: 'Gentle, eco-friendly cleaning.' },
    { icon: Sun, title: 'Dry & Fold', desc: 'Crisp fold, ready to wear.' },
    { icon: PackageCheck, title: 'Pickup / Delivery', desc: 'Get it back fast.' },
  ]

  return (
    <section className="mb-8 sm:mb-12 lg:mb-16">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Laundry Made Simple</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {steps.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card bg-base-100 shadow">
            <div className="card-body items-center text-center p-4 sm:p-6">
              <div className="h-12 w-12 rounded-full grid place-items-center bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="card-title mt-2">{title}</h3>
              <p className="text-base-content/70">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Services Section
const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await serviceAPI.getPublicServices()
      // Only show active services
      setServices(response.data.filter(s => s.isActive))
    } catch (error) {
      console.error('Error fetching services:', error)
      // Fallback to hardcoded data if API fails
      setServices([
        { name: 'T-shirts, Shirts, Shorts', category: 'Full Package', description: 'Full service: Wash, Dry & Fold', price: 29, unit: 'per kg' },
        { name: 'Jeans, Towels, Jackets', category: 'Full Package', description: 'Bedsheets, etc. • Full service', price: 39, unit: 'per kg' },
        { name: 'Comforter', category: 'Full Package', description: 'Full service • Minimum 3kgs', price: 70, unit: 'per kg' },
        { name: 'Dry Only', category: 'Dry Service', description: 'Dryer only service', price: 75, unit: 'per load' },
        { name: 'Dry + Fold', category: 'Dry Service', description: 'Dryer with folding service', price: 90, unit: 'per load' },
        { name: 'Free Pickup & Delivery', category: 'Delivery', description: 'Within 1km radius • Minimum 4kgs', price: 0, unit: 'FREE' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getServiceIcon = (name) => {
    if (name.includes('T-shirts') || name.includes('Shirts')) return Shirt
    if (name.includes('Jeans') || name.includes('Towels')) return Package
    if (name.includes('Comforter')) return HandPlatter
    if (name.includes('Dry Only')) return Sun
    if (name.includes('Dry + Fold')) return Package
    if (name.includes('Pickup')) return Truck
    return Package
  }

  const formatPrice = (service) => {
    if (service.unit === 'FREE') return 'FREE'
    return `₱${service.price}/${service.unit.replace('per ', '')}`
  }

  return (
    <section className="mb-8 sm:mb-12 lg:mb-16">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Our Laundry Services</h2>
      <div className="alert alert-info mb-4 sm:mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span><strong>Important:</strong> All services are minimum of 4kgs per load</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service) => {
            const Icon = getServiceIcon(service.name)
            return (
              <div key={service._id || service.name} className="card bg-base-100 shadow">
                <div className="card-body p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full grid place-items-center bg-secondary/10">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <h3 className="card-title text-sm sm:text-base">{service.name}</h3>
                  </div>
                  {service.category && service.category !== 'Delivery' && (
                    <div className="badge badge-sm badge-primary mt-2">{service.category}</div>
                  )}
                  <p className="text-sm sm:text-base text-base-content/70">{service.description}</p>
                  <div className="text-xl sm:text-2xl font-bold mt-2 text-primary">{formatPrice(service)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// Features Section
const Features = () => {
  const features = [
    { icon: SatelliteDish, title: 'Real-Time Tracking' },
    { icon: Bell, title: 'SMS & Email Alerts' },
    { icon: CreditCard, title: 'Cashless Payments' },
    { icon: Star, title: 'Loyalty Rewards' },
    { icon: Shield, title: 'Secure & Reliable' },
    { icon: Leaf, title: 'Eco-Friendly Cleaning' },
  ]

  return (
    <section className="mb-8 sm:mb-12 lg:mb-16">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Why Choose Laundry Planet?</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {features.map(({ icon: Icon, title }) => (
          <div key={title} className="card bg-base-100 shadow">
            <div className="card-body items-center text-center p-4 sm:p-6">
              <div className="h-12 w-12 rounded-full grid place-items-center bg-accent/10">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="card-title mt-2">{title}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Testimonials Section
const Testimonials = () => (
  <section className="mb-8 sm:mb-12 lg:mb-16">
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Trusted by Customers Across the City</h2>
    <div className="card bg-base-100 shadow">
      <div className="card-body p-4 sm:p-6">
        <div className="rating rating-md">
          <input type="radio" name="rating-1" className="mask mask-star-2 bg-warning" />
          <input type="radio" name="rating-1" className="mask mask-star-2 bg-warning" />
          <input type="radio" name="rating-1" className="mask mask-star-2 bg-warning" />
          <input type="radio" name="rating-1" className="mask mask-star-2 bg-warning" />
          <input type="radio" name="rating-1" className="mask mask-star-2 bg-warning" checked readOnly />
        </div>
        <p className="mt-3 text-sm sm:text-base text-base-content/80">"Laundry Planet made laundry stress-free. I love the tracking feature!"</p>
        <div className="opacity-60 text-xs sm:text-sm">— Happy Customer</div>
      </div>
    </div>
  </section>
)

// Contact Us Section
const ContactUs = () => (
  <section className="mb-8 sm:mb-12 lg:mb-16">
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Contact Us</h2>
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <div className="flex items-center gap-3 text-sm sm:text-base"><MapPin className="h-5 w-5" /><span>123 Clean Street, Metro City</span></div>
          <div className="flex items-center gap-3 text-sm sm:text-base"><Phone className="h-5 w-5" /><span>(+63) 900-000-0000</span></div>
          <div className="flex items-center gap-3 text-sm sm:text-base"><Mail className="h-5 w-5" /><span>hello@laundryplanet.com</span></div>
          <div className="flex items-center gap-3 text-sm sm:text-base"><Clock className="h-5 w-5" /><span>Mon–Sun: 8:00 AM – 8:00 PM</span></div>
        </div>
      </div>
      <div className="card bg-base-100 shadow">
        <figure className="overflow-hidden rounded-box">
          <div className="w-full h-64 md:h-80">
            <iframe
              title="Laundry Planet Location"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10949.429481377485!2d121.02106317244012!3d14.723612129134587!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1eaac4ca001%3A0x854f69650868459f!2sLaundry%20Planet!5e0!3m2!1sen!2sph!4v1765698362266!5m2!1sen!2sph"
            />
          </div>
        </figure>
        <div className="card-body p-4 sm:p-6">
          <p className="text-sm sm:text-base text-base-content/70">Find us easily on the map.</p>
        </div>
      </div>
    </div>
  </section>
)

// Footer Section
const Footer = () => (
  <footer className="bg-base-100 border-t">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div>
          <div className="font-bold text-base sm:text-lg">Laundry Planet</div>
          <div className="opacity-60 text-xs sm:text-sm">© 2025 Laundry Planet</div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#" className="btn btn-ghost btn-sm"><Facebook className="h-4 w-4" /></a>
          <a href="#" className="btn btn-ghost btn-sm"><Instagram className="h-4 w-4" /></a>
          <a href="#" className="btn btn-ghost btn-sm"><Twitter className="h-4 w-4" /></a>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm opacity-70">
          <a href="#services" className="link link-hover">Services</a>
          <a href="#pricing" className="link link-hover">Pricing</a>
          <a href="#contact" className="link link-hover">Contact</a>
          <a href="#terms" className="link link-hover">Terms</a>
          <a href="#privacy" className="link link-hover">Privacy</a>
        </div>
      </div>
    </div>
  </footer>
)

// Main Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate()
  
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.role === 'admin') navigate('/dashboard/admin')
        else if (user.role === 'staff') navigate('/dashboard/staff')
        else navigate('/dashboard/client')
      } catch (err) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-base-200">
      <LandingNavbar />

      <main className="container mx-auto px-4 py-8 space-y-16">
        <div id="home">
          <Hero />
        </div>
        <HowItWorks />
        <div id="services">
          <Services />
        </div>
        <Features />
        <Testimonials />
        <div id="contact">
          <ContactUs />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
