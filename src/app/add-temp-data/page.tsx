"use client"

import React, { useState } from 'react'
import { useFirestore } from '@/firebase'
import { setDoc, doc, collection } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

const tempChallenges = [
  {
    id: 'challenge-1',
    title: 'Array Sum Challenge',
    description: 'Write a function that returns the sum of all elements in an array',
    difficulty: 'easy',
    category: 'Programming',
    totalPoints: 50,
    questions: [
      { id: 'q1', question: 'What is the time complexity of a linear array sum?', options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 1, points: 10 },
      { id: 'q2', question: 'Which method is used to sum arrays in JavaScript?', options: ['reduce()', 'map()', 'filter()', 'forEach()'], correctAnswer: 0, points: 15 },
      { id: 'q3', question: 'What will [1,2,3].reduce((a,b) => a+b) return?', options: ['123', '6', 'undefined', 'error'], correctAnswer: 1, points: 25 }
    ],
    createdAt: new Date()
  },
  {
    id: 'challenge-2',
    title: 'String Reversal',
    description: 'Reverse a string without using built-in methods',
    difficulty: 'easy',
    category: 'Programming',
    totalPoints: 40,
    questions: [
      { id: 'q1', question: 'How to reverse a string in JavaScript?', options: ['split().reverse().join()', 'reverse()', 'flip()', 'swap()'], correctAnswer: 0, points: 20 },
      { id: 'q2', question: 'What does split("") do?', options: ['Creates array of characters', 'Reverses string', 'Joins strings', 'Splits by space'], correctAnswer: 0, points: 20 }
    ],
    createdAt: new Date()
  },
  {
    id: 'challenge-3',
    title: 'Binary Search',
    description: 'Implement binary search algorithm',
    difficulty: 'medium',
    category: 'Programming',
    totalPoints: 100,
    questions: [
      { id: 'q1', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 1, points: 25 },
      { id: 'q2', question: 'Binary search requires the array to be:', options: ['Random', 'Sorted', 'Unique', 'Large'], correctAnswer: 1, points: 25 },
      { id: 'q3', question: 'How many elements can binary search check from 1M items?', options: ['1M', '500K', '~20', '100K'], correctAnswer: 2, points: 25 },
      { id: 'q4', question: 'Which is more efficient: linear or binary search?', options: ['Linear', 'Binary', 'Same', 'Depends'], correctAnswer: 1, points: 25 }
    ],
    createdAt: new Date()
  }
];

const tempResults = [
  { id: 'r1', userId: 'u1', userEmail: 'student1@school.com', displayName: 'Rajesh Kumar', challengeId: 'challenge-1', challengeTitle: 'Array Sum Challenge', correctAnswers: 3, totalQuestions: 3, percentage: 100, totalPoints: 50, difficulty: 'easy', solvedAt: new Date() },
  { id: 'r2', userId: 'u2', userEmail: 'student2@school.com', displayName: 'Priya Singh', challengeId: 'challenge-1', challengeTitle: 'Array Sum Challenge', correctAnswers: 3, totalQuestions: 3, percentage: 100, totalPoints: 50, difficulty: 'easy', solvedAt: new Date(Date.now() - 3600000) },
  { id: 'r3', userId: 'u3', userEmail: 'student3@school.com', displayName: 'Arjun Patel', challengeId: 'challenge-3', challengeTitle: 'Binary Search', correctAnswers: 4, totalQuestions: 4, percentage: 100, totalPoints: 100, difficulty: 'medium', solvedAt: new Date(Date.now() - 7200000) },
  { id: 'r4', userId: 'u4', userEmail: 'student4@school.com', displayName: 'Neha Gupta', challengeId: 'challenge-2', challengeTitle: 'String Reversal', correctAnswers: 2, totalQuestions: 2, percentage: 100, totalPoints: 40, difficulty: 'easy', solvedAt: new Date(Date.now() - 1800000) },
  { id: 'r5', userId: 'u5', userEmail: 'student5@school.com', displayName: 'Vikram Sharma', challengeId: 'challenge-3', challengeTitle: 'Binary Search', correctAnswers: 3, totalQuestions: 4, percentage: 75, totalPoints: 75, difficulty: 'medium', solvedAt: new Date(Date.now() - 5400000) },
  { id: 'r6', userId: 'u1', userEmail: 'student1@school.com', displayName: 'Rajesh Kumar', challengeId: 'challenge-2', challengeTitle: 'String Reversal', correctAnswers: 2, totalQuestions: 2, percentage: 100, totalPoints: 40, difficulty: 'easy', solvedAt: new Date(Date.now() - 900000) },
];

export default function AddTempDataPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const db = useFirestore()

  const handleAddData = async () => {
    if (!db) {
      setStatus('error')
      setMessage('Firestore not available')
      return
    }

    setIsLoading(true)
    setStatus('idle')

    try {
      // Add challenges
      for (const challenge of tempChallenges) {
        await setDoc(doc(db, 'challenges', challenge.id), challenge)
      }

      // Add results
      for (const result of tempResults) {
        await setDoc(doc(db, 'challengeResults', result.id), result)
      }

      setStatus('success')
      setMessage(`✅ Added ${tempChallenges.length} challenges and ${tempResults.length} results. Refresh the home page to see the rankings!`)
    } catch (error: any) {
      setStatus('error')
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="border-2">
          <CardContent className="p-12 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-headline font-bold">🧪 Temporary Data</h1>
              <p className="text-muted-foreground">Add test challenges and rankings data for demonstration</p>
            </div>

            <div className="space-y-4 bg-muted/30 p-6 rounded-xl">
              <h3 className="font-bold">Data to be added:</h3>
              <ul className="space-y-2 text-sm">
                <li>✅ {tempChallenges.length} challenges (Easy & Medium)</li>
                <li>✅ {tempResults.length} student results</li>
                <li>✅ 5 sample students with scores</li>
              </ul>
            </div>

            {status !== 'idle' && (
              <Alert className={status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertTitle className={status === 'success' ? 'text-green-900' : 'text-red-900'}>
                  {status === 'success' ? 'Success!' : 'Error'}
                </AlertTitle>
                <AlertDescription className={status === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleAddData}
              disabled={isLoading}
              size="lg"
              className="w-full h-14 text-lg font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Data...
                </>
              ) : (
                '📊 Add Temporary Data'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              After adding data, go back to the <a href="/" className="text-primary font-bold hover:underline">home page</a> and check the rankings slider on the left side.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
