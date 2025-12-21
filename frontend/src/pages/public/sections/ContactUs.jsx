import React from 'react'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

// Replace the src URL with your actual location embed link from Google Maps
// Get it by clicking "Share" on Google Maps → "Embed a map" → Copy the <iframe> src

const ContactUs = () => (
  <section className="mb-8 sm:mb-12 lg:mb-16">
    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Contact Us</h2>
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body space-y-3">
          <div className="flex items-center gap-3 text-sm sm:text-base"><MapPin className="h-5 w-5" /><span>123 Clean Street, Metro City</span></div>
          <div className="flex items-center gap-3 text-sm sm:text-base"><Phone className="h-5 w-5" /><span>(+63) 900-000-0000</span></div>
          <div className="flex items-center gap-3 text-sm sm:text-base"><Mail className="h-5 w-5" /><span>hello@laundryplanet.com</span></div>
          <div className="flex items-center gap-3 text-sm sm:text-base"><Clock className="h-5 w-5" /><span>Mon–Sun: 8:00 AM – 8:00 PM</span></div>
        </div>
      </div>
      <div className="card bg-base-100 shadow">
        <figure className="overflow-hidden rounded-box">
          <div className="w-full h-64 md:h-80">
            <iframe
              title="Laundry Planet Location"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10949.429481377485!2d121.02106317244012!3d14.723612129134587!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1eaac4ca001%3A0x854f69650868459f!2sLaundry%20Planet!5e0!3m2!1sen!2sph!4v1765698362266!5m2!1sen!2sph"
            />
          </div>
        </figure>
        <div className="card-body p-4 sm:p-6">
          <p className="text-sm sm:text-base text-base-content/70">Find us easily on the map.</p>
        </div>
      </div>
    </div>
  </section>
)

export default ContactUs