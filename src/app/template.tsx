
"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid rendering animations before the client-side environment is ready
  if (!mounted) {
    return <div className="opacity-0">{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: "easeOut", duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}
