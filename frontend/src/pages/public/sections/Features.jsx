import React from 'react'
import { SatelliteDish, Bell, CreditCard, Star, Shield, Leaf } from 'lucide-react'

const features = [
  { icon: SatelliteDish, title: 'Real-Time Tracking' },
  { icon: Bell, title: 'SMS & Email Alerts' },
  { icon: CreditCard, title: 'Cashless Payments' },
  { icon: Star, title: 'Loyalty Rewards' },
  { icon: Shield, title: 'Secure & Reliable' },
  { icon: Leaf, title: 'Eco-Friendly Cleaning' },
]

const Features = () => (
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

export default Features