import React from 'react'
import { Facebook, Instagram, Twitter } from 'lucide-react'

const Footer = () => (
  <footer className="bg-base-100 border-t">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        <div>
          <div className="font-bold text-base sm:text-lg">Laundry Planet</div>
          <div className="opacity-60 text-xs sm:text-sm">© 2025 Laundry Planet</div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#" className="btn btn-ghost btn-sm"><Facebook className="h-4 w-4" /></a>
          <a href="#" className="btn btn-ghost btn-sm"><Instagram className="h-4 w-4" /></a>
          <a href="#" className="btn btn-ghost btn-sm"><Twitter className="h-4 w-4" /></a>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm opacity-70">
          <a href="#services" className="link link-hover">Services</a>
          <a href="#pricing" className="link link-hover">Pricing</a>
          <a href="#contact" className="link link-hover">Contact</a>
          <a href="#terms" className="link link-hover">Terms</a>
          <a href="#privacy" className="link link-hover">Privacy</a>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer