import React from 'react'
import { CalendarClock, Droplets, Sun, PackageCheck } from 'lucide-react'

const steps = [
  { icon: CalendarClock, title: 'Drop Off / Pickup', desc: 'Schedule pickup or visit a branch.' },
  { icon: Droplets, title: 'Wash & Care', desc: 'Gentle, eco-friendly cleaning.' },
  { icon: Sun, title: 'Dry & Fold', desc: 'Crisp fold, ready to wear.' },
  { icon: PackageCheck, title: 'Pickup / Delivery', desc: 'Get it back fast.' },
]

const HowItWorks = () => {
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

export default HowItWorks