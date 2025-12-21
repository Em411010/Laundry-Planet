import React from 'react'
import { Link } from 'react-router-dom'
import { Rocket, Shirt, Droplets, WashingMachine } from 'lucide-react'

const Hero = () => {
  return (
    <section className="grid gap-6 sm:gap-8 md:grid-cols-2 items-center">
      
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Welcome to Laundry Planet</h1>
        <p className="text-sm sm:text-base text-base-content/70">
          Where your clothes get world-class care. Fast, reliable, and eco-friendly services with real-time tracking,
          pickup & delivery, and cashless payments.
        </p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
          <Link to="/order" className="btn btn-primary btn-wide sm:btn-normal">Place an Order</Link>
          <Link to="/track" className="btn btn-secondary btn-wide sm:btn-normal">Track My Laundry</Link>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative h-56 w-56 sm:h-64 sm:w-64 md:h-80 md:w-80 shadow-2xl rounded-full">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-sm" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin [animation-duration:12s]" />
          <div className="absolute inset-6 rounded-full border border-primary/20 animate-spin [animation-duration:18s] [animation-direction:reverse]" />
          <div className="absolute inset-12 rounded-full bg-base-100 shadow-xl grid place-items-center">
            <WashingMachine className="h-24 w-20 text-primary" />
          </div>
          {/* Orbiting icons with initial offsets for variety */}
          <div className="orbit-center" style={{ transform: 'translate(-50%, -50%) rotate(0deg)' }}>
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

export default Hero