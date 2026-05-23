"use client"

import React from 'react'
import { Code, Terminal, Database, Cpu, Globe, Cpu as Chip } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TechBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-background">
      <div className="absolute inset-0 tech-grid opacity-[0.8]"></div>
      
      {/* Dynamic Ambient Orbs - Forest Green & Cream Theme */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[160px] animate-float opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-accent/15 rounded-full blur-[140px] animate-float opacity-30" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[120px] animate-float opacity-20" style={{ animationDelay: '4s' }}></div>
      
      {/* Floating Tech Icons - Smaller and Highlighted */}
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[12%] text-primary"
      >
        <Code size={24} />
      </motion.div>

      <motion.div 
        animate={{ y: [0, 30, 0], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[40%] right-[15%] text-accent"
      >
        <Terminal size={28} />
      </motion.div>

      <motion.div 
        animate={{ x: [0, 20, 0], y: [0, -10, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[20%] left-[20%] text-primary"
      >
        <Database size={20} />
      </motion.div>

      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[35%] text-accent"
      >
        <Chip size={32} />
      </motion.div>

      <motion.div 
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] right-[10%] text-primary opacity-[0.15]"
      >
        <Globe size={80} />
      </motion.div>

      {/* Subtle Grid Points */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_hsl(var(--background))_100%)] opacity-60"></div>
    </div>
  )
}