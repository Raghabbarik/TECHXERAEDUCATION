
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, MapPin, GraduationCap, Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import SplitText from '@/components/SplitText'
import { TechXeraLogo } from '@/components/Navbar'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" } }
}

export default function ExamsPage() {
  const [mounted, setMounted] = useState(false)
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const db = useFirestore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch student profile for approval check
  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)

  const isAdmin = user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login?redirect=/exams')
    }
    // Redirect to dashboard if not approved (and not an admin)
    if (mounted && !isUserLoading && !isProfileLoading && user && profile && !profile.isApproved && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, isProfileLoading, profile, router, mounted, isAdmin])

  const examsQuery = useMemoFirebase(() => query(collection(db, 'exams'), orderBy('examDate', 'asc')), [db])
  const { data: exams, isLoading } = useCollection(examsQuery)

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
      
      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-black tracking-[0.2em] uppercase">
            <Sparkles size={16} /> Campus Calendar
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">
            <SplitText 
              text="Exam Schedule"
              tag="span"
              duration={0.6}
              delay={35}
            />
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl font-medium leading-relaxed">
            Official examination dates and sessions for TechXera students. Please ensure you arrive 30 minutes before the scheduled start time.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Accessing schedule...</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {exams?.map((exam) => (
              <motion.div key={exam.id} variants={itemVariant}>
                <Card className="glass border-none rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group">
                  <div className={`h-2 w-full ${exam.status === 'active' ? 'bg-green-500' : exam.status === 'upcoming' ? 'bg-primary' : 'bg-muted'}`} />
                  <CardContent className="p-8 md:p-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <Badge variant={exam.status === 'active' ? 'default' : exam.status === 'upcoming' ? 'secondary' : 'outline'} className="uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full mb-3">
                          {exam.status}
                        </Badge>
                        <h3 className="text-2xl md:text-3xl font-headline font-bold tracking-tight group-hover:text-primary transition-colors">{exam.title}</h3>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-2xl text-muted-foreground">
                        <CalendarDays size={24} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/5 text-primary rounded-xl"><GraduationCap size={18} /></div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Semester</p>
                          <p className="text-sm font-bold">{exam.semester}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/5 text-primary rounded-xl"><Clock size={18} /></div>
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Start Date</p>
                          <p className="text-sm font-bold">{exam.examDate ? format(new Date(exam.examDate), 'MMM d, yyyy') : 'TBD'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl text-xs text-muted-foreground border border-white/40">
                      <MapPin size={16} className="text-primary shrink-0" />
                      <p>Check your registered email for hall allocations.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {exams?.length === 0 && (
              <div className="col-span-full py-32 text-center border-4 border-dashed border-muted rounded-[3rem] bg-white/30 backdrop-blur-sm">
                <CalendarDays size={64} className="mx-auto text-muted-foreground/20 mb-6" />
                <h2 className="text-xl font-headline font-bold text-muted-foreground">No Examination Sessions Scheduled</h2>
                <p className="text-muted-foreground mt-2 uppercase text-[10px] font-bold tracking-widest">Updates will appear here shortly</p>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
