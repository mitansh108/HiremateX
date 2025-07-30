'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, useAnimation, useReducedMotion } from 'framer-motion'

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const controls = useAnimation()

    useEffect(() => {
        if (isInView) {
            controls.start("visible")
        }
    }, [isInView, controls])

    return (
        <motion.div
            ref={ref}
            animate={controls}
            initial="hidden"
            variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

const FloatingCard = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="h-full"
        >
            {children}
        </motion.div>
    )
}

export default function Home() {
    return (
        <div className="min-h-screen bg-white overflow-hidden">
            {/* Navigation */}
            <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100"
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">H</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">HiremateX</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="text-gray-600 hover:text-orange-500 transition-colors">
                                Login
                            </Link>
                            <Link href="/signup" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative">
                {/* Background Elements - Simplified */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 right-10 w-32 h-32 bg-orange-100 rounded-full opacity-20"></div>
                    <div className="absolute bottom-20 left-10 w-24 h-24 bg-orange-200 rounded-full opacity-30"></div>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <motion.h1
                                className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                Get Noticed Faster
                            </motion.h1>
                            <motion.p
                                className="text-2xl lg:text-3xl font-semibold text-orange-500 mb-6"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                Others Get Silence, You Get Callbacks
                            </motion.p>
                            <motion.p
                                className="text-xl text-gray-600 mb-8 leading-relaxed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                While others spend endless hours writing cover letters and outreach messages, you just let our AI take over. We create perfectly customized content that connects your resume to each job opportunity seamlessly.
                            </motion.p>
                            <motion.div
                                className="flex items-center space-x-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        href="/home"
                                        className="bg-orange-500 text-white px-8 py-4 rounded-xl hover:bg-orange-600 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl"
                                    >
                                        Get Started →
                                    </Link>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-orange-500 hover:text-orange-500 transition-all duration-300 font-medium text-lg">
                                        Watch Demo
                                    </button>
                                </motion.div>
                            </motion.div>
                        </motion.div>

                        {/* Animated Terminal */}
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <motion.div
                                className="bg-gray-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center space-x-2 mb-4">
                                    <motion.div
                                        className="w-3 h-3 bg-red-500 rounded-full"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="w-3 h-3 bg-yellow-500 rounded-full"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                                    />
                                    <motion.div
                                        className="w-3 h-3 bg-green-500 rounded-full"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                                    />
                                    <span className="text-gray-400 text-sm ml-4">HiremateNANO Terminal</span>
                                </div>
                                <div className="font-mono text-sm space-y-2">
                                    <motion.div
                                        className="text-green-400"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 1 }}
                                    >
                                        $ hiremate extract-job https://jobs.company.com/senior-dev
                                    </motion.div>
                                    <motion.div
                                        className="text-blue-400"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 1.5 }}
                                    >
                                        📊 Analyzing job posting...
                                    </motion.div>
                                    <motion.div
                                        className="text-yellow-400"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 2 }}
                                    >
                                        🔍 Extracting requirements...
                                    </motion.div>
                                    <motion.div
                                        className="text-green-400"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 2.5 }}
                                    >
                                        ✅ Job extracted successfully!
                                    </motion.div>
                                    <motion.div
                                        className="text-white space-y-1"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 3 }}
                                    >
                                        <div>Role: Senior Software Engineer</div>
                                        <div>Skills: React, Node.js, Python, AWS</div>
                                        <div>Experience: 5+ years</div>
                                    </motion.div>
                                    <motion.div
                                        className="text-green-400"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 3.5 }}
                                    >
                                        $ hiremate match-resume
                                    </motion.div>
                                    <motion.div
                                        className="text-blue-400"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 4 }}
                                    >
                                        🎯 Compatibility Score: 92%
                                    </motion.div>
                                    <motion.div
                                        className="text-orange-400"
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        ▊
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <AnimatedSection className="px-6 py-20 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Powerful AI Features
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Everything you need to land your dream job, powered by cutting-edge AI technology
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FloatingCard delay={0.1}>
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center h-full border border-gray-100">
                                {/* AI Job Extraction Illustration */}
                                <motion.div
                                    className="w-24 h-24 mx-auto mb-6"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <svg viewBox="0 0 200 200" className="w-full h-full">
                                        {/* Background circle */}
                                        <circle cx="100" cy="100" r="90" fill="#FFF7ED" />
                                        {/* AI Robot */}
                                        <rect x="75" y="50" width="50" height="45" rx="12" fill="#F97316" />
                                        <circle cx="90" cy="65" r="3" fill="white" />
                                        <circle cx="110" cy="65" r="3" fill="white" />
                                        <rect x="92" y="80" width="16" height="2" rx="1" fill="white" />
                                        {/* Antenna */}
                                        <line x1="100" y1="50" x2="100" y2="40" stroke="#F97316" strokeWidth="3" />
                                        <circle cx="100" cy="38" r="3" fill="#F97316" />
                                        {/* Document being scanned */}
                                        <rect x="45" y="110" width="35" height="45" rx="4" fill="white" stroke="#E5E7EB" strokeWidth="2" />
                                        <line x1="52" y1="125" x2="73" y2="125" stroke="#D1D5DB" strokeWidth="1.5" />
                                        <line x1="52" y1="135" x2="68" y2="135" stroke="#D1D5DB" strokeWidth="1.5" />
                                        <line x1="52" y1="145" x2="73" y2="145" stroke="#D1D5DB" strokeWidth="1.5" />
                                        {/* Scanning beam */}
                                        <rect x="45" y="130" width="35" height="3" fill="#F97316" opacity="0.3" />
                                        {/* Arrow */}
                                        <path d="M85 132 L115 132 M110 127 L115 132 L110 137" stroke="#F97316" strokeWidth="2" fill="none" />
                                        {/* Extracted data visualization */}
                                        <rect x="120" y="110" width="35" height="45" rx="4" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                                        <circle cx="130" cy="125" r="2" fill="#F59E0B" />
                                        <circle cx="140" cy="125" r="2" fill="#F59E0B" />
                                        <circle cx="145" cy="125" r="2" fill="#F59E0B" />
                                        <rect x="128" y="140" width="20" height="2" rx="1" fill="#F59E0B" />
                                        <rect x="128" y="148" width="15" height="2" rx="1" fill="#F59E0B" />
                                    </svg>
                                </motion.div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">AI Job Extraction</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Extract detailed job requirements, skills, and qualifications
                                    from any job posting URL using advanced AI technology.
                                </p>
                            </div>
                        </FloatingCard>

                        <FloatingCard delay={0.2}>
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center h-full border border-gray-100">
                                {/* Resume Analysis Illustration */}
                                <motion.div
                                    className="w-24 h-24 mx-auto mb-6"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <svg viewBox="0 0 200 200" className="w-full h-full">
                                        {/* Background circle */}
                                        <circle cx="100" cy="100" r="90" fill="#FFF7ED" />
                                        {/* Person */}
                                        <circle cx="70" cy="70" r="15" fill="#F97316" />
                                        <rect x="55" y="85" width="30" height="40" rx="15" fill="#F97316" />
                                        <rect x="60" y="95" width="20" height="25" fill="#FB923C" />
                                        {/* Resume document */}
                                        <rect x="110" y="50" width="50" height="70" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="2" />
                                        {/* Resume content lines */}
                                        <line x1="118" y1="65" x2="152" y2="65" stroke="#F97316" strokeWidth="3" />
                                        <line x1="118" y1="75" x2="145" y2="75" stroke="#D1D5DB" strokeWidth="2" />
                                        <line x1="118" y1="85" x2="150" y2="85" stroke="#D1D5DB" strokeWidth="2" />
                                        <line x1="118" y1="95" x2="140" y2="95" stroke="#D1D5DB" strokeWidth="2" />
                                        <line x1="118" y1="105" x2="148" y2="105" stroke="#D1D5DB" strokeWidth="2" />
                                        {/* AI Analysis visualization */}
                                        <circle cx="135" cy="140" r="20" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                                        <text x="135" y="145" textAnchor="middle" className="text-xs font-bold" fill="#F59E0B">AI</text>
                                        {/* Analysis results */}
                                        <rect x="45" y="140" width="25" height="4" rx="2" fill="#10B981" />
                                        <rect x="45" y="150" width="20" height="4" rx="2" fill="#F59E0B" />
                                        <rect x="45" y="160" width="30" height="4" rx="2" fill="#EF4444" />
                                        {/* Connecting lines */}
                                        <path d="M110 140 L75 140 M110 150 L70 150 M110 160 L80 160" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="2,2" />
                                    </svg>
                                </motion.div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Resume Parsing</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Upload your resume and get AI-powered analysis of your skills,
                                    experience, and compatibility with job requirements.
                                </p>
                            </div>
                        </FloatingCard>

                        <FloatingCard delay={0.3}>
                            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center h-full border border-gray-100">
                                {/* Job Matching Illustration */}
                                <motion.div
                                    className="w-24 h-24 mx-auto mb-6"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <svg viewBox="0 0 200 200" className="w-full h-full">
                                        {/* Background circle */}
                                        <circle cx="100" cy="100" r="90" fill="#FFF7ED" />
                                        {/* Person silhouette */}
                                        <circle cx="60" cy="60" r="12" fill="#F97316" />
                                        <rect x="48" y="72" width="24" height="30" rx="12" fill="#F97316" />
                                        {/* Heart/Match symbol */}
                                        <path d="M100 85 C95 75, 80 75, 80 90 C80 105, 100 120, 100 120 C100 120, 120 105, 120 90 C120 75, 105 75, 100 85 Z" fill="#EF4444" />
                                        {/* Job posting */}
                                        <rect x="125" y="50" width="40" height="50" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="2" />
                                        <rect x="130" y="60" width="30" height="3" fill="#F97316" />
                                        <rect x="130" y="70" width="25" height="2" fill="#D1D5DB" />
                                        <rect x="130" y="78" width="28" height="2" fill="#D1D5DB" />
                                        <rect x="130" y="86" width="22" height="2" fill="#D1D5DB" />
                                        {/* Matching percentage */}
                                        <circle cx="100" cy="140" r="25" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
                                        <text x="100" y="135" textAnchor="middle" className="text-sm font-bold" fill="#F59E0B">92%</text>
                                        <text x="100" y="150" textAnchor="middle" className="text-xs" fill="#F59E0B">MATCH</text>
                                        {/* Connection lines */}
                                        <path d="M75 85 Q87 85 87 100 Q87 115 75 115" stroke="#10B981" strokeWidth="2" fill="none" strokeDasharray="3,3" />
                                        <path d="M125 85 Q113 85 113 100 Q113 115 125 115" stroke="#10B981" strokeWidth="2" fill="none" strokeDasharray="3,3" />
                                        {/* Stars for rating */}
                                        <polygon points="50,130 52,136 58,136 53,140 55,146 50,142 45,146 47,140 42,136 48,136" fill="#F59E0B" />
                                        <polygon points="150,130 152,136 158,136 153,140 155,146 150,142 145,146 147,140 142,136 148,136" fill="#F59E0B" />
                                    </svg>
                                </motion.div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Perfect Job Matching</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Get compatibility scores, skill gap analysis, and personalized
                                    recommendations to find your perfect job match.
                                </p>
                            </div>
                        </FloatingCard>
                    </div>
                </div>
            </AnimatedSection>

            {/* Dashboard Showcase Section */}
            <AnimatedSection className="px-6 py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
                {/* Background Elements - Static for performance */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-white"
                        >
                            <motion.p
                                className="text-orange-400 font-medium mb-4 tracking-wide uppercase text-sm"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                viewport={{ once: true }}
                            >
                                YOUR JOB SEARCH ENDS HERE
                            </motion.p>

                            <motion.h2
                                className="text-4xl lg:text-6xl font-bold mb-8 leading-tight"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                viewport={{ once: true }}
                            >
                                Your Personal <span className="text-orange-400">AI Recruiter</span>
                            </motion.h2>

                            <div className="space-y-8">
                                {[
                                    {
                                        icon: (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ),
                                        title: "Advanced Job & Resume Match Analysis",
                                        description: "AI-powered compatibility scoring that analyzes your resume against job requirements with 95% accuracy. Get detailed insights on skill gaps and improvement suggestions."
                                    },
                                    {
                                        icon: (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        ),
                                        title: "Single-Click Application Suite",
                                        description: "Generate personalized cover letters, cold emails, LinkedIn DMs, and connection requests instantly. Each message is tailored to the specific job and company."
                                    },
                                    {
                                        icon: (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        ),
                                        title: "Smart Application Tracking",
                                        description: "Track all your applications in one place with automated follow-up reminders, interview scheduling, and progress analytics to optimize your job search strategy."
                                    }
                                ].map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-start space-x-4"
                                        initial={{ opacity: 0, x: -30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.6, delay: 0.5 + index * 0.2 }}
                                        viewport={{ once: true }}
                                    >
                                        <motion.div
                                            className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 flex-shrink-0"
                                            whileHover={{ scale: 1.1, backgroundColor: "rgba(249, 115, 22, 0.3)" }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {feature.icon}
                                        </motion.div>
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                            <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right Dashboard Mockup */}
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            viewport={{ once: true }}
                        >
                            {/* Dashboard Container */}
                            <motion.div
                                className="relative bg-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 shadow-2xl"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Dashboard Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">H</span>
                                        </div>
                                        <span className="text-white font-semibold">HiremateNANO Dashboard</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    </div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {/* Match Score Card */}
                                    <motion.div
                                        className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl p-4 border border-orange-500/20"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 0.8 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="text-orange-400 text-sm font-medium mb-1">Match Score</div>
                                        <div className="text-white text-2xl font-bold">92%</div>
                                        <div className="text-gray-400 text-xs">vs Senior Dev Role</div>
                                    </motion.div>

                                    {/* Applications Card */}
                                    <motion.div
                                        className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-4 border border-blue-500/20"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: 1 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="text-blue-400 text-sm font-medium mb-1">Applications</div>
                                        <div className="text-white text-2xl font-bold">24</div>
                                        <div className="text-gray-400 text-xs">This month</div>
                                    </motion.div>
                                </div>

                                {/* Progress Chart */}
                                <motion.div
                                    className="bg-gray-700/30 rounded-2xl p-4 mb-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 1.2 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="text-white text-sm font-medium mb-3">Application Progress</div>
                                    <div className="h-24 bg-gradient-to-r from-orange-500/20 to-orange-400/10 rounded-lg relative overflow-hidden">
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-orange-500/40 to-orange-400/20"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "75%" }}
                                            transition={{ duration: 1.5, delay: 1.5 }}
                                            viewport={{ once: true }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-white font-semibold">75% Complete</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Recent Activity */}
                                <motion.div
                                    className="space-y-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 1.4 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="text-white text-sm font-medium mb-2">Recent Activity</div>
                                    {[
                                        { action: "Cover letter generated", company: "Google", time: "2m ago" },
                                        { action: "LinkedIn DM sent", company: "Meta", time: "1h ago" },
                                        { action: "Job match found", company: "Netflix", time: "3h ago" }
                                    ].map((activity, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center justify-between text-xs"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 1.6 + index * 0.1 }}
                                            viewport={{ once: true }}
                                        >
                                            <div className="text-gray-300">
                                                <span className="text-orange-400">{activity.action}</span> for {activity.company}
                                            </div>
                                            <div className="text-gray-500">{activity.time}</div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            {/* Floating Elements */}
                            <motion.div
                                className="absolute -top-4 -right-4 w-8 h-8 bg-orange-500 rounded-full opacity-60"
                                animate={{
                                    y: [0, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <motion.div
                                className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-500/30 rounded-full"
                                animate={{
                                    rotate: 360,
                                    scale: [1, 0.8, 1]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                        </motion.div>
                    </div>
                </div>
            </AnimatedSection>

            {/* Stats Section */}
            <AnimatedSection className="px-6 py-20 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: "10K+", label: "Jobs Analyzed" },
                            { number: "95%", label: "Match Accuracy" },
                            { number: "2.5x", label: "Faster Applications" },
                            { number: "500+", label: "Happy Users" }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="p-6"
                            >
                                <motion.div
                                    className="text-4xl lg:text-5xl font-bold text-orange-500 mb-2"
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {stat.number}
                                </motion.div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* User Reviews Section */}
            <AnimatedSection className="px-6 py-20 bg-white">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            What Our Users Say
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Join thousands of satisfied job seekers who found their dream jobs with HiremateNANO
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Sarah Chen",
                                role: "Software Engineer at Google",
                                avatar: "SC",
                                rating: 5,
                                review: "HiremateNANO helped me land my dream job at Google! The AI matching was incredibly accurate and saved me weeks of manual application writing."
                            },
                            {
                                name: "Marcus Johnson",
                                role: "Product Manager at Meta",
                                avatar: "MJ",
                                rating: 5,
                                review: "The resume analysis feature is game-changing. It identified skill gaps I didn't even know I had and helped me tailor my applications perfectly."
                            },
                            {
                                name: "Emily Rodriguez",
                                role: "Data Scientist at Netflix",
                                avatar: "ER",
                                rating: 5,
                                review: "I got 3x more interview calls after using HiremateNANO. The personalized cover letters and LinkedIn messages are incredibly effective."
                            }
                        ].map((review, index) => (
                            <FloatingCard key={index} delay={index * 0.1}>
                                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                                            {review.avatar}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{review.name}</h4>
                                            <p className="text-sm text-gray-600">{review.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex mb-4">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <motion.svg
                                                key={i}
                                                className="w-5 h-5 text-orange-500"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                initial={{ opacity: 0, scale: 0 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: i * 0.1 }}
                                                viewport={{ once: true }}
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </motion.svg>
                                        ))}
                                    </div>
                                    <p className="text-gray-600 leading-relaxed italic">
                                        "{review.review}"
                                    </p>
                                </div>
                            </FloatingCard>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* FAQ Section */}
            <AnimatedSection className="px-6 py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        {/* FAQ Illustration */}
                        <motion.div
                            className="w-32 h-32 mx-auto mb-8"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                        >

                        </motion.div>
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600">
                            Everything you need to know about HiremateNANO
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {[
                            {
                                question: "How does the AI job extraction work?",
                                answer: "Our AI analyzes job postings from any URL and extracts key requirements, skills, qualifications, and company information. It uses advanced natural language processing to understand job descriptions and create structured data that can be matched against your profile."
                            },
                            {
                                question: "Is my resume data secure and private?",
                                answer: "Absolutely. We use enterprise-grade encryption to protect your data. Your resume and personal information are never shared with third parties, and you have full control over your data. You can delete your information at any time."
                            },
                            {
                                question: "How accurate is the job matching algorithm?",
                                answer: "Our AI matching algorithm has a 95% accuracy rate based on user feedback. It considers your skills, experience, career goals, and preferences to find the most relevant job opportunities. The more you use the platform, the better it gets at understanding your preferences."
                            },
                            {
                                question: "Can I customize the generated applications?",
                                answer: "Yes! All generated cover letters, LinkedIn messages, and application materials are fully customizable. Our AI provides a strong foundation that you can edit and personalize to match your voice and specific requirements."
                            },
                            {
                                question: "What file formats do you support for resume upload?",
                                answer: "We support PDF, DOC, DOCX, and TXT formats. Our AI can parse most standard resume formats and extract relevant information including work experience, education, skills, and contact details."
                            },
                            {
                                question: "How much does HiremateNANO cost?",
                                answer: "We offer a free tier with basic features and premium plans starting at $19/month. The premium plan includes unlimited job extractions, advanced matching algorithms, and priority support. You can cancel anytime."
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                            >
                                <motion.details
                                    className="group"
                                    whileHover={{ scale: 1.01 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                                        <h3 className="text-lg font-semibold text-gray-900 pr-4">
                                            {faq.question}
                                        </h3>
                                        <motion.svg
                                            className="w-6 h-6 text-orange-500 transform transition-transform group-open:rotate-180"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </motion.svg>
                                    </summary>
                                    <div className="px-6 pb-6">
                                        <p className="text-gray-600 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </motion.details>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* CTA Section */}
            <AnimatedSection className="px-6 py-20 bg-gradient-to-br from-orange-50 to-white">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h2
                        className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        Ready to accelerate your job search?
                    </motion.h2>
                    <motion.p
                        className="text-xl text-gray-600 mb-8 leading-relaxed"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        Join thousands of job seekers who are landing their dream jobs faster
                        with AI-powered job matching and application generation.
                    </motion.p>
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href="/login"
                                className="bg-orange-500 text-white px-8 py-4 rounded-xl hover:bg-orange-600 transition-all duration-300 font-medium text-lg shadow-lg hover:shadow-xl"
                            >
                                Get Started Free
                            </Link>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href="/signup"
                                className="border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-xl hover:bg-orange-500 hover:text-white transition-all duration-300 font-medium text-lg"
                            >
                                Learn More
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </AnimatedSection>

            {/* Footer */}
            <footer className="px-6 py-12 bg-gray-900 text-white">
                <motion.div
                    className="max-w-7xl mx-auto text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <motion.div
                            className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                        >
                            <span className="text-white font-bold text-sm">H</span>
                        </motion.div>
                        <span className="text-xl font-bold">HiremateNANO</span>
                    </div>
                    <p className="text-gray-400">
                        AI-powered job matching platform built for modern job seekers
                    </p>
                </motion.div>
            </footer>
        </div>
    )
}