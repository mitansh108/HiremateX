'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface GifDemoProps {
  src: string
  title: string
  description: string
  step: number
  className?: string
}

export const GifDemo: React.FC<GifDemoProps> = ({
  src,
  title,
  description,
  step,
  className = ""
}) => {
  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-white border border-gray-200">
        {/* Step Number Badge */}
        <div className="absolute top-4 left-4 z-10">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{step}</span>
          </div>
        </div>

        {/* Actual GIF */}
        <div className="aspect-[21/9] relative overflow-hidden rounded-lg w-full">
          <Image
            src={src}
            alt={`${title} demonstration`}
            fill
            className="object-cover"
            unoptimized={true} // Allows GIFs to animate
          />
        </div>

        {/* Info Section */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      </div>
    </motion.div>
  )
}

export const ProcessFlow: React.FC = () => {
  const steps = [
    {
      id: "upload",
      src: "/gifs/res.gif",
      title: "Upload Your Resume",
      description: "Simply drag and drop your resume. Our AI instantly parses your skills, experience, and qualifications.",
      step: 1
    },
    {
      id: "paste",
      src: "/gifs/jobs.gif",
      title: "Paste Job URL",
      description: "Copy any job posting URL. Our AI extracts requirements, skills, and company details in seconds.",
      step: 2
    },
    {
      id: "analyze",
      src: "/gifs/skill.gif",
      title: "AI Match Analysis",
      description: "Get detailed compatibility scores, skill gap analysis, and personalized improvement suggestions.",
      step: 3
    },
    {
      id: "generate",
      src: "/gifs/content.gif",
      title: "Generate Content",
      description: "Create personalized cover letters, cold emails, and LinkedIn messages tailored to each opportunity.",
      step: 4
    }
  ]

  return (
    <div className="space-y-16">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          id={step.id}
          initial={{
            opacity: 0,
            x: index % 2 === 0 ? -200 : 200
          }}
          whileInView={{
            opacity: 1,
            x: 0
          }}
          exit={{
            opacity: 0,
            x: index % 2 === 0 ? -200 : 200
          }}
          transition={{
            duration: 1,
            delay: index * 0.6,
            ease: "easeOut"
          }}
          viewport={{ once: true, margin: "-100px" }}
          className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
            }`}
        >
          {/* Content */}
          <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
            <motion.div
              initial={{
                opacity: 0,
                x: index % 2 === 0 ? -100 : 100
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: index % 2 === 0 ? -100 : 100
              }}
              transition={{ duration: 1.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-orange-500 to-orange-300 flex-1"></div>
              </div>

              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-xl text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          </div>

          {/* GIF Demo */}
          <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
            <motion.div
              initial={{
                opacity: 0,
                x: index % 2 === 0 ? 100 : -100
              }}
              whileInView={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: index % 2 === 0 ? 100 : -100
              }}
              transition={{ duration: 1.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <GifDemo {...step} />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}