"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Zap } from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import { motion } from 'framer-motion'

interface StudentRanking {
  id: string
  displayName: string
  userEmail: string
  totalPoints: number
  challengesCompleted: number
  totalTimeTaken: number
}

export default function RankingsPage() {
  const [mounted, setMounted] = useState(false)
  const db = useFirestore()
  const [rankings, setRankings] = useState<StudentRanking[]>([])

  // Fetch challenge results to calculate rankings
  const resultsRef = useMemoFirebase(
    () => (db ? query(collection(db, 'challengeResults'), orderBy('solvedAt', 'desc')) : null),
    [db]
  )
  const { data: resultsData } = useCollection(resultsRef)

  // Fetch all students to map correct names
  const studentsRef = useMemoFirebase(() => (db ? collection(db, 'students') : null), [db])
  const { data: studentsData } = useCollection(studentsRef)

  useEffect(() => {
    setMounted(true)
    if (resultsData && Array.isArray(resultsData) && studentsData) {
      // Aggregate results by user
      const userMap = new Map<string, StudentRanking>()
      
      // Initialize map with ALL students first
      studentsData.forEach(student => {
        userMap.set(student.id, {
          id: student.id,
          displayName: `${student.firstName} ${student.lastName}`,
          userEmail: student.email || `${student.studentId || ''}@student.com`,
          totalPoints: 0,
          challengesCompleted: 0,
          totalTimeTaken: 0
        })
      })

      resultsData.forEach((result: any) => {
        const key = result.userId
        
        if (!userMap.has(key)) {
          userMap.set(key, {
            id: result.userId,
            displayName: result.displayName || 'Student',
            userEmail: result.userEmail,
            totalPoints: 0,
            challengesCompleted: 0,
            totalTimeTaken: 0
          })
        }

        const student = userMap.get(key)!
        student.totalPoints += result.totalPoints || 0
        student.challengesCompleted += 1
        student.totalTimeTaken += result.timeTaken || 999999
      })

      // Sort by total points, then completions, then by least time taken
      const sortedRankings = Array.from(userMap.values())
        .sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints
          }
          if (b.challengesCompleted !== a.challengesCompleted) {
            return b.challengesCompleted - a.challengesCompleted
          }
          return a.totalTimeTaken - b.totalTimeTaken
        })
        .slice(0, 100)

      setRankings(sortedRankings)
    }
  }, [resultsData, studentsData])

  if (!mounted) return null

  const getMedalIcon = (rank: number, completed: number) => {
    if (completed === 0) return <span className="text-lg font-bold text-muted-foreground">-</span>

    switch (rank) {
      case 1:
        return <Medal className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-orange-400" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds >= 999999) return "N/A"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TechBackground />

      <div className="container mx-auto px-4 md:px-6 max-w-4xl py-16 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold">Challenge Rankings</h1>
          </div>
          <p className="text-muted-foreground">
            Top performers on the challenge board
          </p>
        </motion.div>

        {rankings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/20 bg-primary/5 text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No rankings yet. Be the first to complete a challenge!</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {rankings.map((student, idx) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`transition-all hover:shadow-lg ${idx < 3 && student.challengesCompleted > 0 ? 'border-primary/30 bg-primary/5' : ''} ${student.challengesCompleted === 0 ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        <div className={`flex items-center justify-center w-12 sm:w-16 shrink-0 h-12 sm:h-16 rounded-2xl ${student.challengesCompleted === 0 ? 'bg-muted' : 'bg-background/50'}`}>
                          {getMedalIcon(idx + 1, student.challengesCompleted)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-lg truncate">{student.displayName}</h3>
                            <Badge variant="secondary" className="h-5 px-1.5 text-[9px] uppercase tracking-widest bg-primary/10 text-primary border-none shrink-0 rounded-md">TechXera</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{student.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 bg-muted/30 p-4 rounded-xl sm:bg-transparent sm:p-0">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center sm:justify-end gap-1 text-yellow-600 font-bold text-xl">
                            <Zap className="h-5 w-5" />
                            {student.totalPoints}
                          </div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mt-1">Points Earned</p>
                        </div>
                        <div className="w-px h-10 bg-border/40 sm:hidden"></div>
                        <div className="text-right">
                          <div className="flex items-center sm:justify-end gap-1 text-primary font-bold text-xl">
                            {formatTime(student.totalTimeTaken)}
                          </div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mt-1">Time Taken</p>
                        </div>
                        <div className="w-px h-10 bg-border/40 sm:hidden"></div>
                        <div className="text-right">
                          <div className="font-bold text-xl text-primary">{student.challengesCompleted}</div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mt-1">Completed</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
