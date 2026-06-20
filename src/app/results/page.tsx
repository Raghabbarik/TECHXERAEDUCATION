
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ClipboardList, Search, Loader2, Download, AlertCircle, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase'
import { collection, query, where, getDocs, getDoc, DocumentData, limit, doc } from 'firebase/firestore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import SplitText from '@/components/SplitText'
import { TechXeraLogo } from '@/components/Navbar'


export default function ResultsLookupPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [studentIdInput, setStudentIdInput] = useState('')
  const [examIdInput, setExamIdInput] = useState('')
  const [studentData, setStudentData] = useState<DocumentData | null>(null)
  const [results, setResults] = useState<DocumentData[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const db = useFirestore()
  const { toast } = useToast()

  const examsQuery = useMemoFirebase(() => (db ? collection(db, 'exams') : null), [db])
  const { data: allExams } = useCollection(examsQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  const teacherRef = useMemoFirebase(() => (user && db ? doc(db, 'teachers', user.uid) : null), [user, db])
  const { data: teacherProfile } = useDoc(teacherRef)
  const isAdmin = teacherProfile?.role === 'admin';

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login?redirect=/results')
    }
    // Redirect to dashboard if not approved (and not an admin)
    if (mounted && !isUserLoading && !isProfileLoading && user && profile && !profile.isApproved && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, isProfileLoading, profile, router, mounted, isAdmin])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    
    const trimmedId = studentIdInput.trim().toUpperCase() // Force uppercase for matching

    if (!trimmedId || !examIdInput) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your Roll Number and select an Exam/Subject."
      })
      return
    }

    setLoading(true)
    setError(null)
    setStudentData(null)
    setResults([])

    try {
      const studentsRef = collection(db, 'students')
      const q = query(studentsRef, where('studentId', '==', trimmedId), limit(1))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("No student record found with this Roll Number.")
      }

      const studentDoc = querySnapshot.docs[0]
      const data = studentDoc.data()

      const resultRef = doc(db, 'students', studentDoc.id, 'results', examIdInput)
      const resultSnap = await getDoc(resultRef)
      
      if (!resultSnap.exists()) {
        throw new Error("No results found for the specified exam/subject.")
      }
      
      let fetchedResults: any[] = [{ id: resultSnap.id, ...resultSnap.data() }]

      fetchedResults.sort((a, b) => {
        const dateA = a.examDate ? new Date(a.examDate).getTime() : 0
        const dateB = b.examDate ? new Date(b.examDate).getTime() : 0
        return dateB - dateA
      })

      setStudentData(data)
      setResults(fetchedResults)
      
      toast({
        title: "Record Found",
        description: `Academic transcript retrieved for ${data.firstName} ${data.lastName}.`
      })
    } catch (err: any) {
      console.error("Lookup error:", err)
      setError(err.message || "An unexpected error occurred during the lookup.")
      toast({
        variant: "destructive",
        title: "Lookup Failed",
        description: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <TechXeraLogo className="w-16 h-16 opacity-50" />
        </motion.div>
      </div>
    )
  }

  // Allow Admin OR Approved Students
  if (!user || (!profile?.isApproved && !isAdmin)) {
    if (isAdmin) {
      // Proceed
    } else {
      return null
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-32 pb-32 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!studentData ? (
            <motion.div 
              key="lookup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg mt-12"
            >
              <Card className="glass border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
                <CardHeader className="text-center pb-8 border-b border-border/40 bg-primary/5 p-10">
                  <div className="mx-auto w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    <ClipboardList size={32} />
                  </div>
                  <CardTitle className="text-3xl font-headline font-bold">
                    <SplitText 
                      text="Check Results"
                      tag="span"
                      duration={0.6}
                      delay={30}
                    />
                  </CardTitle>
                  <CardDescription className="text-base">Enter credentials to view mark sheet</CardDescription>
                </CardHeader>
                <form onSubmit={handleLookup}>
                  <CardContent className="space-y-6 p-10">
                    {error && (
                      <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 text-sm font-medium border border-destructive/20">
                        <AlertCircle size={18} /> {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="id" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Roll Number</Label>
                      <Input 
                        id="id" 
                        placeholder="e.g. TX-2025-001" 
                        className="h-14 bg-background/50 text-lg font-bold rounded-2xl border-none ring-1 ring-border focus-visible:ring-primary" 
                        required 
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Subject / Paper</Label>
                      <Select required value={examIdInput} onValueChange={setExamIdInput}>
                        <SelectTrigger id="exam" className="h-14 bg-background/50 rounded-2xl border-none ring-1 ring-border focus-visible:ring-primary w-full text-left font-bold px-4">
                          <SelectValue placeholder="-- Select Exam --" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[300px]">
                          {allExams?.map(exam => (
                            <SelectItem key={exam.id} value={exam.id} className="font-medium text-base py-3 cursor-pointer">
                              {exam.title} - {exam.semester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <div className="p-10 pt-0">
                    <Button disabled={loading} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl">
                      {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" size={20} />}
                      {loading ? 'Searching...' : 'Retrieve Results'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="transcript"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full mt-12"
            >
              <Card className="glass border-none shadow-2xl overflow-hidden max-w-5xl mx-auto rounded-[3rem]">
                <CardHeader className="bg-primary text-white p-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <CardTitle className="text-3xl font-headline font-bold">Academic Transcript</CardTitle>
                      <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                        Official Record • TechXera Campus
                      </CardDescription>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 font-bold h-12 px-6 rounded-xl">
                        <Download className="mr-2" size={18} /> PDF
                      </Button>
                      <Button variant="ghost" className="text-white hover:bg-white/10 font-bold h-12 px-6 rounded-xl" onClick={() => setStudentData(null)}>
                        <RefreshCw className="mr-2" size={18} /> Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-border/20 bg-muted/5">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Student</p>
                      <p className="text-2xl font-bold tracking-tight">{studentData.firstName} {studentData.lastName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Roll No</p>
                      <p className="text-2xl font-bold text-primary tracking-tight">{studentData.studentId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Status</p>
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                        <span className="font-black text-green-600 uppercase text-xs tracking-widest">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/30 border-b border-border/20">
                        <tr>
                          <th className="p-6 px-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Subject</th>
                          <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Session</th>
                          <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Score</th>
                          <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Grade</th>
                          <th className="p-6 px-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.length > 0 ? (
                          results.map((res, i) => (
                            <motion.tr 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              key={res.id} 
                              className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors"
                            >
                              <td className="p-6 px-10">
                                <p className="font-bold text-lg">{res.subject}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-medium">{res.semester}</p>
                              </td>
                              <td className="p-6 text-sm font-bold text-muted-foreground">{res.examTitle || 'Assessment'}</td>
                              <td className="p-6 text-sm font-bold">{res.marks}%</td>
                              <td className="p-6 text-center">
                                <span className="font-black text-3xl text-primary">{res.grade}</span>
                              </td>
                              <td className="p-6 px-10">
                                <p className="text-xs font-medium text-muted-foreground max-w-[200px] italic leading-relaxed">
                                  {res.remark || '---'}
                                </p>
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="p-24 text-center text-muted-foreground font-bold italic text-sm opacity-40 uppercase tracking-widest">No academic records found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {results.length > 0 && (
                    <div className="p-10 bg-primary/5 flex flex-col md:flex-row justify-between items-center gap-10 border-t border-border/20">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Evaluated Subjects</p>
                        <p className="text-4xl font-headline font-bold text-primary">{results.length}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Verification</p>
                        <p className="text-2xl font-bold text-green-600 uppercase tracking-tighter">Certified Result</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto leading-relaxed font-medium">
                  Note: This is an official digital transcript. For formal validation or credentialing, please contact the campus registrar office.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
