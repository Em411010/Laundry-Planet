import React from 'react'
import { Link } from 'react-router-dom'
import LandingNavbar from '../../components/navbars/LandingNavbar'
import { 
  CalendarClock, Droplets, Sun, PackageCheck, 
  Smartphone, MapPin, CreditCard, Bell, 
  CheckCircle, Clock, Shield, Leaf,
  ArrowRight, Home
} from 'lucide-react'

const HowItWorksPage = () => {
  const steps = [
    {
      number: '01',
      icon: Smartphone,
      title: 'Book Online or Call',
      description: 'Schedule your laundry pickup through our website, app, or give us a call. Choose your preferred time slot.',
      tips: ['Available 7 days a week', 'Flexible scheduling', 'Instant confirmation']
    },
    {
      number: '02',
      icon: MapPin,
      title: 'Free Pickup',
      description: 'Our friendly staff will come to your doorstep to collect your laundry at your scheduled time.',
      tips: ['Within 1km radius', 'Minimum 6kgs', 'Safe & secure handling']
    },
    {
      number: '03',
      icon: Droplets,
      title: 'Professional Cleaning',
      description: 'Your clothes are carefully sorted, washed with premium eco-friendly detergents, and handled with care.',
      tips: ['Eco-friendly products', 'Fabric-specific care', 'Quality assurance']
    },
    {
      number: '04',
      icon: Sun,
      title: 'Dry & Fold',
      description: 'Clothes are professionally dried, neatly folded or hung, and packaged for delivery.',
      tips: ['Gentle drying process', 'Professional folding', 'Organized packaging']
    },
    {
      number: '05',
      icon: Bell,
      title: 'Real-Time Updates',
      description: 'Track your order status in real-time. Get notified when your laundry is ready for delivery.',
      tips: ['SMS notifications', 'Live order tracking', 'Estimated delivery time']
    },
    {
      number: '06',
      icon: PackageCheck,
      title: 'Fast Delivery',
      description: 'Clean, fresh laundry delivered back to your doorstep. Quick turnaround guaranteed!',
      tips: ['24-48 hour service', 'Free delivery', 'Satisfaction guaranteed']
    }
  ]

  const features = [
    {
      icon: Clock,
      title: 'Quick Turnaround',
      description: 'Standard service completed within 24-48 hours',
      color: 'text-primary'
    },
    {
      icon: CreditCard,
      title: 'Cashless Payment',
      description: 'Pay securely online or on delivery',
      color: 'text-secondary'
    },
    {
      icon: Shield,
      title: 'Quality Guarantee',
      description: 'We stand behind our work with a satisfaction guarantee',
      color: 'text-accent'
    },
    {
      icon: Leaf,
      title: 'Eco-Friendly',
      description: 'Using biodegradable detergents and sustainable practices',
      color: 'text-success'
    }
  ]

  return (
    <div className="min-h-screen bg-base-200">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h1>
            <p className="text-lg text-base-content/70 mb-6">
              Your laundry journey from pickup to delivery - simple, fast, and hassle-free
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register" className="btn btn-primary">
                Get Started
                <ArrowRight size={20} />
              </Link>
              <Link to="/landing" className="btn btn-outline">
                <Home size={20} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Steps Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="space-y-16">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
            >
              {/* Step Number & Icon */}
              <div className="flex-shrink-0 w-full md:w-1/3 flex flex-col items-center">
                <div className="relative">
                  <div className="text-8xl font-bold text-primary/10 absolute -top-8 -left-4">
                    {step.number}
                  </div>
                  <div className="relative z-10 w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-xl">
                    <step.icon size={40} />
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 w-full">
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h3 className="card-title text-2xl mb-2">{step.title}</h3>
                    <p className="text-base-content/70 mb-4">{step.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.tips.map((tip, i) => (
                        <div key={i} className="badge badge-outline gap-2">
                          <CheckCircle size={14} />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-base-300 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Laundry Planet?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card bg-base-100 shadow-lg">
                <div className="card-body items-center text-center">
                  <div className={`w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon size={32} />
                  </div>
                  <h3 className="card-title text-lg">{feature.title}</h3>
                  <p className="text-sm text-base-content/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-2xl">
          <div className="card-body items-center text-center py-12">
            <h2 className="card-title text-3xl md:text-4xl mb-4">Ready to Experience Fresh Laundry?</h2>
            <p className="text-lg mb-6 max-w-2xl">
              Join thousands of satisfied customers who trust us with their laundry. Get started today!
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link to="/register" className="btn btn-neutral btn-lg">
                Create Account
                <ArrowRight size={20} />
              </Link>
              <Link to="/order" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                Place an Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content">
        <div>
          <p className="font-bold">Laundry Planet - Fresh Laundry, Happy Life</p>
          <p>Copyright © {new Date().getFullYear()} - All rights reserved</p>
        </div>
      </footer>
    </div>
  )
}

export default HowItWorksPage
