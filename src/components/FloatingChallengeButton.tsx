"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

interface FloatingChallengeButtonProps {
  containerRef: React.RefObject<HTMLDivElement>
}

export default function FloatingChallengeButton({ containerRef }: FloatingChallengeButtonProps) {
  const router = useRouter()
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const generateRandomPosition = () => {
      if (!containerRef.current) return

      const container = containerRef.current
      const buttonWidth = 160
      const buttonHeight = 56

      // Get container size
      const width = container.offsetWidth
      const height = container.offsetHeight
      setContainerSize({ width, height })

      // Generate random position within container bounds with padding
      const padding = 20
      const maxX = Math.max(0, width - buttonWidth - padding)
      const maxY = Math.max(0, height - buttonHeight - padding)

      const newX = Math.random() * maxX + padding
      const newY = Math.random() * maxY + padding

      setPosition({ x: newX, y: newY })
    }

    // Generate initial position
    setTimeout(generateRandomPosition, 100)

    // Set up interval to change position every 3-4 seconds
    const interval = setInterval(() => {
      generateRandomPosition()
    }, 3000 + Math.random() * 1000)

    // Handle window resize
    const handleResize = () => {
      generateRandomPosition()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [containerRef])

  const handleClick = () => {
    router.push('/challenges')
  }

  return (
    <div
      ref={buttonRef}
      className="absolute w-0 h-0 overflow-visible"
      style={{
        left: 0,
        top: 0,
      }}
    >
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        animate={{
          x: position.x,
          y: position.y,
          scale: isHovering ? 1.1 : 1,
        }}
        transition={{
          x: { type: 'spring', stiffness: 60, damping: 20 },
          y: { type: 'spring', stiffness: 60, damping: 20 },
          scale: { duration: 0.3 },
        }}
        className="px-6 py-3 bg-gradient-to-r from-secondary via-secondary to-yellow-500 hover:from-secondary/90 hover:via-secondary/90 hover:to-yellow-400 text-white font-bold rounded-full text-sm md:text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap z-20 cursor-pointer"
        style={{
          boxShadow: isHovering 
            ? '0 0 30px rgba(251, 146, 60, 0.6), 0 0 60px rgba(251, 146, 60, 0.3)' 
            : '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
      >
        <motion.div
          animate={isHovering ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.6, repeat: isHovering ? Infinity : 0, repeatType: 'loop' }}
        >
          <Zap size={18} />
        </motion.div>
        <span>Start Challenge</span>
      </motion.button>
    </div>
  )
}
