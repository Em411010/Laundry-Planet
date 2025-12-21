import React from 'react'
import { Leaf, Recycle, Droplets } from 'lucide-react'

const Sustainability = () => (
  <section className="mb-8 sm:mb-12 lg:mb-16">
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Caring for Your Clothes — and the Planet</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full grid place-items-center bg-success/10">
              <Leaf className="h-5 w-5 text-success" />
            </div>
            <h3 className="card-title">Eco-Friendly Detergents</h3>
          </div>
          <p className="text-sm sm:text-base text-base-content/70">Low-impact, biodegradable solutions.</p>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full grid place-items-center bg-info/10">
              <Droplets className="h-5 w-5 text-info" />
            </div>
            <h3 className="card-title">Water-Saving Processes</h3>
          </div>
          <p className="text-sm sm:text-base text-base-content/70">Smart cycles that conserve water.</p>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full grid place-items-center bg-warning/10">
              <Recycle className="h-5 w-5 text-warning" />
            </div>
            <h3 className="card-title">Energy Efficient Machines</h3>
          </div>
          <p className="text-sm sm:text-base text-base-content/70">Lower energy footprint.</p>
        </div>
      </div>
    </div>
  </section>
)

export default Sustainability