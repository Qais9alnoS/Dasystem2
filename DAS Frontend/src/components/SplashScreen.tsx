import React, { useEffect, useState } from "react"

interface SplashScreenProps {
  onComplete: () => void
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [showContent, setShowContent] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const contentTimer = setTimeout(() => setShowContent(true), 200)
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500)
    const completeTimer = setTimeout(() => onComplete(), 3000)

    return () => {
      clearTimeout(contentTimer)
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-50 bg-background transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Professional Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Animated accent lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
        <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-shimmer-delayed" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div className={`transition-all duration-1000 ease-out ${
          showContent
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}>

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-16">
            {/* Professional Logo Badge */}
            <div className="relative mb-8">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-3xl blur-2xl animate-pulse-glow" />

              {/* Logo container */}
              <div className="relative bg-card dark:bg-card/50 backdrop-blur-sm border border-border dark:border-border/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-center w-32 h-32">
                  {/* DAS Logo with modern styling */}
                  <div className="text-center">
                    <div className="text-6xl font-black text-primary mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em' }}>
                      DAS
                    </div>
                    <div className="flex justify-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-center space-y-3">
              <h1 className="text-5xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Tajawal', 'Plus Jakarta Sans', sans-serif" }}>
                أهلاً وسهلاً
              </h1>
              <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
              <p className="text-xl text-muted-foreground font-medium">
                مدرسة دمشق العربية
              </p>
              <p className="text-sm text-muted-foreground/70 font-light">
                نظام الإدارة المتكامل
              </p>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-64 h-1.5 bg-muted/20 dark:bg-muted/30 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-loading-slide"
                   style={{ backgroundSize: '200% 100%' }} />
            </div>
            <p className="text-xs text-muted-foreground/60 font-medium tracking-wider">
              جاري التحميل...
            </p>
          </div>
        </div>
      </div>

      {/* Version Badge - Bottom Right */}
      <div className="absolute bottom-6 right-6 text-xs text-muted-foreground/40 font-mono">
        v1.0.0
      </div>

      <style>
        {`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          @keyframes shimmer-delayed {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }

          @keyframes pulse-glow {
            0%, 100% {
              opacity: 0.3;
              transform: scale(0.95);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.05);
            }
          }

          @keyframes loading-slide {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          .animate-shimmer {
            animation: shimmer 3s ease-in-out infinite;
          }

          .animate-shimmer-delayed {
            animation: shimmer-delayed 3s ease-in-out infinite 1.5s;
          }

          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }

          .animate-loading-slide {
            animation: loading-slide 2.5s ease-in-out forwards;
          }
        `}
      </style>
    </div>
  )
}