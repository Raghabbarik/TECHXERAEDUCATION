"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Zap, Trophy, Target, Code, CheckCircle2, Lock, 
  Loader2, AlertCircle, Plus, Trash2, Edit, ArrowRight, XCircle
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase'
import { collection, query, orderBy, where, setDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  questions: Question[]
  totalPoints: number
  timeLimit?: number
  createdAt: any
}

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  points: number
}

interface UserProgress {
  challengesAttempted: number
  challengesCompleted: number
  totalPoints: number
  solvedChallenges: string[]
  challengeAttempts?: { [challengeId: string]: number }
}

export default function ChallengesPage() {
  const [mounted, setMounted] = useState(false)
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [isAttemptDialogOpen, setIsAttemptDialogOpen] = useState(false)
  const [currentAnswers, setCurrentAnswers] = useState<{ [key: string]: number }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([])
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const router = useRouter()

  // Fetch all challenges
  const challengesRef = useMemoFirebase(
    () => (db ? query(collection(db, 'challenges'), orderBy('createdAt', 'desc')) : null),
    [db]
  )
  const { data: challengesData } = useCollection(challengesRef)
  const challenges: Challenge[] = challengesData || []

  // Fetch user progress
  const userProgressRef = useMemoFirebase(
    () => (db && user?.uid ? doc(db, 'users', user.uid, 'progress', 'challenges') : null),
    [db, user?.uid]
  )
  const { data: userProgress } = useDoc(userProgressRef)

  useEffect(() => {
    setMounted(true)
    if (userProgress?.solvedChallenges) {
      setCompletedChallenges(userProgress.solvedChallenges)
    }
  }, [userProgress])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAttemptDialogOpen && timerRemaining !== null && timerRemaining > 0 && !isSubmitting) {
      interval = setInterval(() => {
        setTimerRemaining(prev => prev! - 1)
      }, 1000)
    } else if (timerRemaining === 0 && isAttemptDialogOpen && !isSubmitting) {
      toast({ title: "Time's up!", description: "Auto-submitting your current answers...", variant: "destructive" })
      setTimerRemaining(null)
      handleSubmitAnswers()
    }
    return () => clearInterval(interval)
  }, [isAttemptDialogOpen, timerRemaining, isSubmitting])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!mounted) return null

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <TechBackground />
        <div className="container mx-auto py-16 pt-32">
          <Alert className="border-amber-500/50 bg-amber-50/50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Login Required</AlertTitle>
            <AlertDescription className="text-amber-800">
              Please login to access challenges
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const handleStartChallenge = (challenge: Challenge) => {
    const attempts = userProgress?.challengeAttempts?.[challenge.id] || 0
    if (attempts >= 2) {
      toast({
        title: "Attempt Limit Reached",
        description: "You have already attempted this challenge the maximum number of times (2).",
        variant: "destructive"
      })
      return
    }

    setSelectedChallenge(challenge)
    setCurrentAnswers({})
    setTimerRemaining(challenge.timeLimit ? challenge.timeLimit * 60 : 10 * 60)
    setIsAttemptDialogOpen(true)
    setIsReviewMode(false)
  }

  const handleReviewChallenge = async (challenge: Challenge) => {
    if (!user) return
    try {
      const resultDocRef = doc(db, 'challengeResults', user.uid + '_' + challenge.id)
      const resultDoc = await getDoc(resultDocRef)
      
      let userAnswers = {};
      if (resultDoc.exists()) {
        const data = resultDoc.data()
        userAnswers = data.userAnswers || {}
      } else {
        toast({ title: "Partial Data Displayed", description: "Your specific answers were lost, but you can still review the challenge and its correct answers.", variant: "default" })
      }
      
      setCurrentAnswers(userAnswers)
      setSelectedChallenge(challenge)
      setIsReviewMode(true)
      setIsAttemptDialogOpen(true)
      setTimerRemaining(null)
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to load results.", variant: "destructive" })
    }
  }

  const handleSubmitAnswers = async () => {
    if (!selectedChallenge || !user) return

    setIsSubmitting(true)
    try {
      const questions = selectedChallenge.questions
      let correctCount = 0
      let totalPoints = 0

      questions.forEach((q, idx) => {
        if (currentAnswers[q.id] === q.correctAnswer) {
          correctCount++
          totalPoints += q.points
        }
      })

      const percentage = (correctCount / questions.length) * 100
      const isPassed = percentage >= 60

      const progressRef = doc(db, 'users', user.uid, 'progress', 'challenges')
      const progressDoc = await getDoc(progressRef)
      const currentAttemptsMap = progressDoc.exists() ? (progressDoc.data().challengeAttempts || {}) : {}
      const newAttemptCount = (currentAttemptsMap[selectedChallenge.id] || 0) + 1

      if (progressDoc.exists()) {
        await updateDoc(progressRef, {
          totalPoints: isPassed ? increment(totalPoints) : increment(0),
          challengesCompleted: isPassed ? increment(1) : increment(0),
          solvedChallenges: isPassed ? [...(progressDoc.data().solvedChallenges || []), selectedChallenge.id] : progressDoc.data().solvedChallenges,
          challengeAttempts: {
            ...currentAttemptsMap,
            [selectedChallenge.id]: newAttemptCount
          },
          lastUpdated: new Date()
        })
      } else {
        await setDoc(progressRef, {
          totalPoints: isPassed ? totalPoints : 0,
          challengesCompleted: isPassed ? 1 : 0,
          challengesAttempted: 1,
          solvedChallenges: isPassed ? [selectedChallenge.id] : [],
          challengeAttempts: { [selectedChallenge.id]: 1 },
          createdAt: new Date(),
          lastUpdated: new Date()
        })
      }

      if (isPassed) {
        // Update user progress
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || 'Student',
            createdAt: new Date()
          })
        }

        // Add to solved challenges list
        const durationLimit = selectedChallenge.timeLimit ? selectedChallenge.timeLimit * 60 : 600
        const timeTaken = timerRemaining !== null ? durationLimit - timerRemaining : durationLimit

        const resultRef = doc(db, 'challengeResults', user.uid + '_' + selectedChallenge.id)
        await setDoc(resultRef, {
          userId: user.uid,
          userEmail: user.email,
          displayName: user.displayName || 'Student',
          challengeId: selectedChallenge.id,
          challengeTitle: selectedChallenge.title,
          correctAnswers: correctCount,
          totalQuestions: questions.length,
          percentage,
          totalPoints,
          difficulty: selectedChallenge.difficulty,
          solvedAt: new Date(),
          userAnswers: currentAnswers,
          timeTaken
        })

        setCompletedChallenges([...completedChallenges, selectedChallenge.id])
        toast({
          title: "Challenge Completed! 🎉",
          description: `You scored ${totalPoints} points with ${percentage.toFixed(0)}% correct answers`,
          className: "bg-green-50 border-green-200"
        })
        setTimeout(() => {
          router.push('/rankings')
        }, 1500)
      } else {
        toast({
          title: "Not Passed",
          description: `You scored ${percentage.toFixed(0)}%. Need 60% to pass.`,
          className: "bg-amber-50 border-amber-200"
        })
      }

      setIsAttemptDialogOpen(false)
    } catch (error) {
      console.error('Error submitting challenge:', error)
      toast({
        title: "Error",
        description: "Failed to submit challenge",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'hard':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TechBackground />

      <div className="container mx-auto px-4 md:px-6 max-w-7xl py-16 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center md:text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Challenges</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Solve challenges, earn points, and climb the rankings
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
          >
            <Card className="w-full border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Challenges Completed</p>
                  <p className="text-3xl font-bold">{userProgress?.challengesCompleted || 0}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <Card className="w-full border-yellow-500/20 bg-yellow-50/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                  <p className="text-3xl font-bold text-yellow-600">{userProgress?.totalPoints || 0}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <Card className="w-full border-blue-500/20 bg-blue-50/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Available</p>
                  <p className="text-3xl font-bold text-blue-600">{challenges.length}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Challenges Grid */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mb-8 w-full md:w-auto">
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="easy">Easy</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="hard">Hard</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
              {challenges.map((challenge, idx) => {
                const isCompleted = completedChallenges.includes(challenge.id)
                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="h-full"
                  >
                    <Card className={`cursor-pointer transition-all hover:shadow-lg h-full flex flex-col ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty.toUpperCase()}
                          </Badge>
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        </div>
                        <CardTitle className="text-xl">{challenge.title}</CardTitle>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Questions:</span>
                            <span className="font-semibold">{challenge.questions.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Points:</span>
                            <span className="font-semibold text-yellow-600">{challenge.totalPoints}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => isCompleted ? handleReviewChallenge(challenge) : handleStartChallenge(challenge)}
                          variant={isCompleted ? "secondary" : "default"}
                          className="w-full"
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Review Answers
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Start Challenge
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          {['easy', 'medium', 'hard'].map(difficulty => (
            <TabsContent key={difficulty} value={difficulty}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                {challenges
                  .filter(c => c.difficulty === difficulty)
                  .map((challenge, idx) => {
                    const isCompleted = completedChallenges.includes(challenge.id)
                    return (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="h-full"
                      >
                        <Card className={`cursor-pointer transition-all hover:shadow-lg h-full flex flex-col ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={getDifficultyColor(challenge.difficulty)}>
                                {challenge.difficulty.toUpperCase()}
                              </Badge>
                              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            </div>
                            <CardTitle className="text-xl">{challenge.title}</CardTitle>
                            <CardDescription>{challenge.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Questions:</span>
                                <span className="font-semibold">{challenge.questions.length}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Points:</span>
                                <span className="font-semibold text-yellow-600">{challenge.totalPoints}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Time Limit:</span>
                                <span className="font-semibold text-blue-600">
                                  {challenge.timeLimit ? `${challenge.timeLimit} mins` : '10 mins'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Attempts Remaining:</span>
                                <span className="font-semibold text-red-600">
                                  {Math.max(0, 2 - (userProgress?.challengeAttempts?.[challenge.id] || 0))}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => isCompleted ? handleReviewChallenge(challenge) : handleStartChallenge(challenge)}
                              variant={isCompleted ? "secondary" : "default"}
                              className="w-full"
                            >
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Review Answers
                                </>
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-2" />
                                  Start Challenge
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Challenge Attempt Dialog */}
      <Dialog open={isAttemptDialogOpen} onOpenChange={setIsAttemptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>{selectedChallenge?.title}</DialogTitle>
              {timerRemaining !== null && (
                <Badge variant={timerRemaining < 60 ? "destructive" : "secondary"} className="text-sm font-bold ml-4">
                  Time: {formatTime(timerRemaining)}
                </Badge>
              )}
            </div>
            <DialogDescription>
              {selectedChallenge?.questions.length} questions • {selectedChallenge?.totalPoints} points
            </DialogDescription>
          </DialogHeader>

          {selectedChallenge && (
            <div className="space-y-6">
              {selectedChallenge.questions.map((question, qIdx) => (
                <Card key={question.id} className="border-primary/20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">
                      Question {qIdx + 1}: {question.question} 
                      <span className="text-sm text-yellow-600 ml-2">({question.points} pts)</span>
                    </h3>
                      <div className="space-y-2">
                        {question.options.map((option, optIdx) => {
                          const isSelectedOptAndReview = isReviewMode && currentAnswers[question.id] === optIdx
                          const isCorrectOptAndReview = isReviewMode && question.correctAnswer === optIdx
                          const isCorrect = isReviewMode && currentAnswers[question.id] === question.correctAnswer
                          
                          let bgClass = "hover:bg-primary/5 border rounded-lg cursor-pointer"
                          if (isReviewMode) {
                            if (isCorrectOptAndReview) bgClass = "bg-green-100 border-green-400 rounded-lg cursor-default"
                            else if (isSelectedOptAndReview && !isCorrect) bgClass = "bg-red-100 border-red-400 rounded-lg cursor-default"
                            else bgClass = "bg-muted/30 border rounded-lg opacity-60 cursor-default"
                          }

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 transition ${bgClass}`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={optIdx}
                                checked={currentAnswers[question.id] === optIdx}
                                onChange={() => !isReviewMode && setCurrentAnswers({ ...currentAnswers, [question.id]: optIdx })}
                                disabled={isReviewMode}
                                className={`w-4 h-4 ${isReviewMode ? 'opacity-100 disabled:opacity-100' : ''}`}
                              />
                              <span className={isReviewMode && isSelectedOptAndReview && !isCorrect ? "line-through text-red-500" : ""}>{option}</span>
                              {isReviewMode && isCorrectOptAndReview && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                              {isReviewMode && isSelectedOptAndReview && !isCorrect && (
                                <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                              )}
                            </label>
                          )
                        })}
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            {isReviewMode ? (
              <Button onClick={() => setIsAttemptDialogOpen(false)} className="w-full">
                Close Review
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsAttemptDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAnswers}
                  disabled={isSubmitting || Object.keys(currentAnswers).length !== selectedChallenge?.questions.length}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Answers
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
