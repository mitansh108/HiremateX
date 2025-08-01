'use client'

import React, { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-orange-500 origin-left z-50"
      style={{ scaleX }}
    />
  )
}

export const ProcessSteps: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [visible, setVisible] = useState(false)
  
  const steps = [
    { id: 'upload', title: 'Upload Resume', icon: '📄' },
    { id: 'paste', title: 'Paste Job URL', icon: '🔗' },
    { id: 'analyze', title: 'AI Analysis', icon: '🧠' },
    { id: 'generate', title: 'Generate Content', icon: '✨' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2
      const sections = steps.map(step => document.getElementById(step.id))
      
      // Highlight active step
      sections.forEach((section, index) => {
        if (section) {
          const { offsetTop, offsetHeight } = section
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveStep(index)
          }
        }
      })
      
      // Control visibility based on overall section
      const processSection = document.getElementById('process-section')
      if (processSection) {
        const rect = processSection.getBoundingClientRect()
        const inView = rect.top < window.innerHeight && rect.bottom > 0
        setVisible(inView)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Trigger once on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className={`flex items-center space-x-3 cursor-pointer group ${
              activeStep === index ? 'opacity-100' : 'opacity-40'
            }`}
            onClick={() => {
              document.getElementById(step.id)?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
              })
            }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeStep === index 
                ? 'bg-orange-500 scale-125' 
                : 'bg-gray-300 group-hover:bg-orange-300'
            }`} />
            
            <motion.div
              className={`bg-white px-3 py-1 rounded-lg shadow-lg border transition-all duration-300 ${
                activeStep === index 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'
              }`}
            >
              <span className="text-sm font-medium text-gray-700">
                {step.icon} {step.title}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}