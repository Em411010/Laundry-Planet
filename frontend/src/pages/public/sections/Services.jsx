import React from 'react'
import { HandPlatter, Droplets, Package, Shirt, Truck } from 'lucide-react'

const services = [
  { icon: HandPlatter, title: 'Full Service', desc: 'Wash • Dry • Fold', price: 'per kg' },
  { icon: Droplets, title: 'Wash & Dry', desc: 'Gentle cycles, optimal care', price: 'per kg' },
  { icon: Shirt, title: 'Dry & Fold', desc: 'Neatly folded garments', price: 'per kg' },
  { icon: Package, title: 'Ironing Only', desc: 'Pressed and ready', price: 'per item' },
  { icon: Truck, title: 'Pickup & Delivery', desc: 'Convenient door-to-door', price: 'fixed fee' },
]

const Services = () => {
  return (
    <section className="mb-8 sm:mb-12 lg:mb-16">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Our Laundry Services</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services.map(({ icon: Icon, title, desc, price }) => (
          <div key={title} className="card bg-base-100 shadow">
            <div className="card-body p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full grid place-items-center bg-secondary/10">
                  <Icon className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="card-title">{title}</h3>
              </div>
              <p className="text-sm sm:text-base text-base-content/70">{desc}</p>
              <div className="text-xs sm:text-sm opacity-70">Starting {price}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Services