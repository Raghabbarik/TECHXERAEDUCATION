'use client'

import React, { useEffect, useState } from 'react'
import { ArrowRight, Zap, Trophy, ChevronLeft, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'

export default function NavigationButtons() {
  const [mounted, setMounted] = useState(true)
  const [isRankingsOpen, setIsRankingsOpen] = useState(false)
  const [currentRankingPage, setCurrentRankingPage] = useState(0)
  const [rankings, setRankings] = useState<any[]>([])
  const db = useFirestore()
  const pathname = usePathname()
  
  // Check if we're on home page
  const isHomePage = pathname === '/'
  const isChallengePage = pathname === '/challenges'

  // Fetch challenge results for rankings
  const resultsRef = useMemoFirebase(
    () => (db ? query(collection(db, 'challengeResults'), orderBy('solvedAt', 'desc')) : null),
    [db]
  )
  const { data: resultsData } = useCollection(resultsRef)

  useEffect(() => {
    if (resultsData && Array.isArray(resultsData)) {
      const userMap = new Map<string, any>()

      resultsData.forEach((result: any) => {
        const key = result.userId
        if (!userMap.has(key)) {
          userMap.set(key, {
            id: result.userId,
            displayName: result.displayName || 'Anonymous',
            userEmail: result.userEmail,
            totalPoints: 0,
            challengesCompleted: 0
          })
        }

        const student = userMap.get(key)!
        student.totalPoints += result.totalPoints || 0
        student.challengesCompleted += 1
      })

      const sortedRankings = Array.from(userMap.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 10)

      setRankings(sortedRankings)
    }
  }, [resultsData])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Rankings Slider Panel */}
      <motion.div
        initial={{ x: -450 }}
        animate={{ x: isRankingsOpen ? 0 : -450 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto"
      >
        <div className="w-96 bg-white dark:bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-r-[2rem] border border-border/40 overflow-hidden backdrop-blur-sm">
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Top Challengers
              </h3>
            </div>

            {rankings.length > 0 ? (
              <div className="space-y-3">
                {rankings.slice(currentRankingPage * 3, (currentRankingPage + 1) * 3).map((student, idx) => {
                  const actualRank = currentRankingPage * 3 + idx + 1
                  let medalEmoji = ''
                  if (actualRank === 1) medalEmoji = '🥇'
                  else if (actualRank === 2) medalEmoji = '🥈'
                  else if (actualRank === 3) medalEmoji = '🥉'

                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{medalEmoji || `#${actualRank}`}</span>
                        <span className="text-xs font-bold uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {student.totalPoints} pts
                        </span>
                      </div>
                      <p className="font-bold text-sm truncate">{student.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.userEmail}</p>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Trophy className="h-12 w-12 mx-auto opacity-20 mb-2" />
                <p className="text-sm text-muted-foreground">No rankings yet</p>
              </div>
            )}

            {rankings.length > 3 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => setCurrentRankingPage(Math.max(0, currentRankingPage - 1))}
                  disabled={currentRankingPage === 0}
                  className="p-2 hover:bg-primary/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-muted-foreground">
                  {currentRankingPage + 1} / {Math.ceil(rankings.length / 3)}
                </span>
                <button
                  onClick={() => setCurrentRankingPage(Math.min(Math.ceil(rankings.length / 3) - 1, currentRankingPage + 1))}
                  disabled={currentRankingPage >= Math.ceil(rankings.length / 3) - 1}
                  className="p-2 hover:bg-primary/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <Link href="/rankings" className="block">
              <Button className="w-full bg-primary hover:bg-primary/90">View All Rankings</Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Backdrop blur overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isRankingsOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsRankingsOpen(false)}
        className={`fixed inset-0 backdrop-blur-sm z-30 ${isRankingsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
      />

      {/* HOME PAGE - ONLY RANKINGS & CHALLENGES */}
      {isHomePage && (
        <>
          {/* Compact Circular Button - Rankings (LEFT SIDE CENTER) */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            onClick={() => setIsRankingsOpen(!isRankingsOpen)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="fixed left-4 top-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white shadow-lg flex items-center justify-center z-[9999] cursor-pointer pointer-events-auto font-bold text-lg"
            style={{
              transform: 'translate(0, calc(-50% - 90px))',
              boxShadow: '0 0 15px rgba(251, 146, 60, 0.5)'
            }}
            title="View Rankings"
          >
            🏆
          </motion.button>

          {/* Compact Circular Button - Challenges (LEFT SIDE CENTER) */}
          <Link href="/challenges" className="fixed left-4 top-1/2 z-[9999] pointer-events-auto" style={{ transform: 'translateY(-50%)' }}>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.1 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-secondary via-secondary to-orange-500 hover:from-secondary/90 hover:via-secondary/90 hover:to-orange-400 text-white shadow-lg flex items-center justify-center font-bold text-lg"
              style={{
                boxShadow: '0 0 15px rgba(251, 146, 60, 0.5)'
              }}
              title="Start Challenge"
            >
              ⚡
            </motion.button>
          </Link>
        </>
      )}

      {/* OTHER PAGES - EXTRA SPACING BETWEEN RANKING & CHALLENGES */}
      {!isHomePage && (
        <>
          {/* Compact Circular Button - Rankings (LEFT SIDE CENTER) - MORE SPACE */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            onClick={() => setIsRankingsOpen(!isRankingsOpen)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={`fixed left-4 top-1/2 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white shadow-lg flex items-center justify-center z-[9999] cursor-pointer pointer-events-auto font-bold ${isChallengePage ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'}`}
            style={{
              transform: 'translate(0, calc(-50% - 400px))',
              boxShadow: '0 0 15px rgba(251, 146, 60, 0.5)'
            }}
            title="View Rankings"
          >
            🏆
          </motion.button>

          {/* Compact Circular Button - Challenges (LEFT SIDE CENTER) - MORE SPACE */}
          <Link href="/challenges" className="fixed left-4 top-1/2 z-[9999] pointer-events-auto" style={{ transform: 'translateY(-50%)' }}>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.1 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-full bg-gradient-to-r from-secondary via-secondary to-orange-500 hover:from-secondary/90 hover:via-secondary/90 hover:to-orange-400 text-white shadow-lg flex items-center justify-center font-bold ${isChallengePage ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'}`}
              style={{
                boxShadow: '0 0 15px rgba(251, 146, 60, 0.5)'
              }}
              title="Start Challenge"
            >
              ⚡
            </motion.button>
          </Link>

          {/* Compact Circular Button - Home (LEFT SIDE CENTER) */}
          <Link href="/" className="fixed left-4 top-1/2 z-[9999] pointer-events-auto" style={{ transform: 'translateY(calc(-50% + 180px))' }}>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.2 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded-full bg-gradient-to-r from-primary via-primary to-blue-600 hover:from-primary/90 hover:via-primary/90 hover:to-blue-500 text-white shadow-lg flex items-center justify-center font-bold ${isChallengePage ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'}`}
              style={{
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
              }}
              title="Back to Home"
            >
              🏠
            </motion.button>
          </Link>
        </>
      )}
    </div>
  )
}
