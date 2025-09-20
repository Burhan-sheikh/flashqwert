import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'

const HeroSection = () => {
  return (
    <div className="w-full overflow-x-hidden bg-blue-200 m-0">
      <section className="w-full pt-8 pb-10 flex flex-col items-center justify-center min-h-[30vh] m-0">

        

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center font-black text-2xl md:text-5xl leading-tight mb-6 max-w-4xl"
        >
          <span className="bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
            Instantly Generate & Download
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Static QR Codes for Unlimited Use
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-sm max-w-2xl mx-auto text-slate-700 leading-relaxed"
        >
Fast, simple, and reliable QR code generation. Export in professional layouts — single pages with details or grids of 2–30 per page</motion.p>


      </section>
    </div>
  )
}

export default HeroSection
