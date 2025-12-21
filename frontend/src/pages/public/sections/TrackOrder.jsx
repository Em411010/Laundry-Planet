import React, { useState } from 'react'
import { QrCode } from 'lucide-react'

const TrackOrder = () => {
  const [orderNo, setOrderNo] = useState('')

  const track = () => {
    // Replace with actual navigation or API
    if (orderNo.trim()) {
      window.location.href = `/track?order=${encodeURIComponent(orderNo.trim())}`
    }
  }

  return (
    <section className="mb-8 sm:mb-12 lg:mb-16">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Track Your Laundry</h2>
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
            <div className="join w-full sm:w-auto">
              <input
                className="input input-bordered join-item w-full sm:w-72 rounded-l-box"
                placeholder="Order Number"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
              <button
                className="btn btn-primary join-item w-auto rounded-r-box shadow"
                onClick={track}
              >
                Track Now
              </button>
            </div>
            <button className="btn btn-outline w-full sm:w-auto">
              <QrCode className="h-5 w-5" />
              <span className="ml-2">Scan QR</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrackOrder