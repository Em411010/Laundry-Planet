import React from 'react'
import { Link } from 'react-router-dom'

const FinalCTA = () => (
  <section className="text-center mb-8 sm:mb-12 lg:mb-16">
    <div className="card bg-base-100 shadow">
      <div className="card-body items-center p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Ready to Experience a Cleaner World?</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn btn-primary btn-wide sm:btn-normal">Create an Account</Link>
          <Link to="/order" className="btn btn-secondary btn-wide sm:btn-normal">Schedule a Pickup</Link>
        </div>
      </div>
    </div>
  </section>
)

export default FinalCTA