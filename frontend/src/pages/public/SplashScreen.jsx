import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SplashScreen = () => {
  const navigate = useNavigate()
  const [showVideo, setShowVideo] = useState(true)
  const [showText, setShowText] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem('splashShown')
    if (splashShown) {
      navigate('/landing')
      return
    }

    const video = document.getElementById('splash-video')
    
    const handleVideoEnd = () => {
      setShowVideo(false)
      setShowText(true)
      
      // Show text for 2 seconds then fade out
      setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => {
          sessionStorage.setItem('splashShown', 'true')
          navigate('/landing')
        }, 800) // Wait for fade out animation
      }, 3000)
    }

    if (video) {
      video.addEventListener('ended', handleVideoEnd)
      return () => video.removeEventListener('ended', handleVideoEnd)
    }
  }, [navigate])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden">{showVideo && (
        <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
          <video
            id="splash-video"
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain drop-shadow-2xl"
          >
            <source src="/Splash.mp4" type="video/mp4" />
          </video>
        </div>
      )}{showText && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 ${fadeOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className="text-center space-y-8 px-4"><div className="animate-slide-down">
              <h1 className="mt-4 text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 tracking-wider animate-pulse-slow">
                AROS
              </h1>
              <p className="text-xl md:text-2xl text-blue-300 italic mt-4 tracking-wide">
                "Advancing Real-World Operational Solutions"
              </p>
            </div><div className="flex items-center justify-center space-x-4 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </div><div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-2xl md:text-3xl font-bold text-cyan-300 tracking-widest">
                CPE211 - SOFTWARE DESIGN
              </p>
              <p className="text-xl md:text-2xl font-semibold text-blue-400">
                BSCPE 22001
              </p>
            </div><div className="mt-12 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="inline-block bg-blue-950/30 backdrop-blur-sm border border-blue-500/30 rounded-2xl px-8 py-6">
                <p className="text-sm text-blue-300 mb-3 tracking-wider">DEVELOPED BY</p>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-x-2 gap-y-2 text-base md:text-lg text-white font-medium">
                  <p className="hover:text-cyan-400 transition-colors">AMIT JEED</p>
                  <p className="hover:text-cyan-400 transition-colors">EMMANUEL JR PORSONA</p>
                  <p className="hover:text-cyan-400 transition-colors">DIONE PATRI BORRES</p>
                  <p className="hover:text-cyan-400 transition-colors">CLARENCE FABILLAR</p>
                  <p className="hover:text-cyan-400 transition-colors">EURI DELA PENA</p>
                </div>
              </div>
            </div><div className="mt-6 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <div className="inline-block bg-cyan-950/30 backdrop-blur-sm border border-cyan-500/30 rounded-2xl px-8 py-4">
                <p className="text-sm text-cyan-300 mb-2 tracking-wider">ADVISOR</p>
                <p className="text-lg md:text-xl text-white font-semibold hover:text-cyan-400 transition-colors">
                  ENGR. ROSALIE GALANG
                </p>
              </div>
            </div><div className="flex justify-center space-x-2 mt-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SplashScreen
