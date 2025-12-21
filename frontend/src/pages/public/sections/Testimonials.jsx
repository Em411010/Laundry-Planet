import React from 'react'

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
        <p className="mt-3 text-sm sm:text-base text-base-content/80">“Laundry Planet made laundry stress-free. I love the tracking feature!”</p>
        <div className="opacity-60 text-xs sm:text-sm">— Happy Customer</div>
      </div>
    </div>
  </section>
)

export default Testimonials