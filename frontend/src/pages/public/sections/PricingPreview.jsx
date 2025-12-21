import React from 'react'
import { Link } from 'react-router-dom'

const items = [
  { title: 'Wash & Dry', detail: 'per kg', price: '₱60' },
  { title: 'Full Service', detail: 'per kg', price: '₱90' },
  { title: 'Pickup & Delivery', detail: 'fixed fee', price: '₱80' },
]

const PricingPreview = () => (
  <section className="mb-8 sm:mb-12 lg:mb-16">
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Simple, Transparent Pricing</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map(({ title, detail, price }) => (
        <div key={title} className="card bg-base-100 shadow">
          <div className="card-body p-4 sm:p-6">
            <h3 className="card-title">{title}</h3>
            <div className="opacity-70 text-xs sm:text-sm">{detail}</div>
            <div className="text-2xl font-bold mt-2">{price}</div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 sm:mt-6">
      <Link to="/pricing" className="btn btn-primary btn-wide sm:btn-normal">View Full Pricing</Link>
    </div>
  </section>
)

export default PricingPreview