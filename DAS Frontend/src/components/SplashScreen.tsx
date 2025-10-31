import React, { useEffect, useState } from "react"
import { School } from "lucide-react"

interface SplashScreenProps {
  onComplete: () => void
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [showLogo, setShowLogo] = useState(false)
  const [showTitle, setShowTitle] = useState(false)

  useEffect(() => {
    // Start logo animation after a brief delay
    const logoTimer = setTimeout(() => setShowLogo(true), 500)

    // Start title animation after logo
    const titleTimer = setTimeout(() => setShowTitle(true), 1500)

    // Complete splash screen
    const completeTimer = setTimeout(() => onComplete(), 3000)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(titleTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-32 right-32 w-40 h-40 bg-primary/8 rounded-2xl blur-2xl"></div>
        <div className="absolute bottom-32 left-32 w-32 h-32 bg-secondary/6 rounded-2xl blur-2xl"></div>
        <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-accent/4 rounded-2xl blur-xl"></div>
      </div>

      <div className="relative z-10 text-center">
        {/* School Icon */}
        <div className={`mb-8 transition-all duration-1000 ${showLogo ? 'animate-logo-zoom' : 'opacity-0'}`}>
          <div className="w-32 h-32 mx-auto flex items-center justify-center bg-primary/10 rounded-full drop-shadow-2xl">
            <School className="w-16 h-16 text-primary" />
          </div>
        </div>

        {/* App Title */}
        <div className={`transition-all duration-1000 ${showTitle ? 'animate-text-reveal' : 'opacity-0'}`}>
          <h1 className="text-5xl font-bold text-primary mb-2 tracking-wider">
            برنامج جين
          </h1>
          <p className="text-xl text-muted-foreground font-medium tracking-wide">
            الجدولة الذكية لمدرسة دمشق العربية
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-12">
          <div className="w-16 h-1 bg-muted rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse loading-bar" />
          </div>
        </div>
      </div>

      <style>
        {`
          .loading-bar {
            animation: loading 3s ease-in-out forwards;
          }
          
          @keyframes loading {
            0% { width: 0% }
            100% { width: 100% }
          }
        `}
      </style>
    </div>
  )
}