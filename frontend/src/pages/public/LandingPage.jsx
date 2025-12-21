import LandingNavbar from '../../components/Navbars/LandingNavbar.jsx'
import Hero from './sections/Hero.jsx'
import HowItWorks from './sections/HowItWorks.jsx'
import Services from './sections/Services.jsx'
import Features from './sections/Features.jsx'
import Testimonials from './sections/Testimonials.jsx'
import PricingPreview from './sections/PricingPreview.jsx'
import TrackOrder from './sections/TrackOrder.jsx'
import Sustainability from './sections/Sustainability.jsx'
import ContactUs from './sections/ContactUs.jsx'
import FinalCTA from './sections/FinalCTA.jsx'
import Footer from './sections/Footer.jsx'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <LandingNavbar />

      <main className="container mx-auto px-4 py-8 space-y-16">
        <Hero />
        <HowItWorks />
        <Services />
        <Features />
        <Testimonials />
        <PricingPreview />
        <TrackOrder />
        <Sustainability />
        <ContactUs />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
