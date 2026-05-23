
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QrCode, ShieldCheck, AlertCircle, Clock, Calendar, CheckCircle2, Loader2, TrendingUp, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase'
import { doc, collection, query, where } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import SplitText from '@/components/SplitText'
import { QRCodeSVG } from 'qrcode.react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false)
  const [isIDModalOpen, setIsIDModalOpen] = useState(false)
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)

  const isAdmin = user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  // Fetch all class sessions to determine total count
  const sessionsQuery = useMemoFirebase(() => (db ? collection(db, 'sessions') : null), [db])
  const { data: sessions } = useCollection(sessionsQuery)

  // Real-time attendance collection for the student
  const attendanceQuery = useMemoFirebase(() => (user && db ? query(collection(db, 'attendance'), where('studentUid', '==', user.uid)) : null), [user, db])
  const { data: attendanceRaw, isLoading: isAttendanceLoading } = useCollection(attendanceQuery)

  // Client-side sorting for maximum reliability
  const attendance = useMemo(() => {
    if (!attendanceRaw) return []
    return [...attendanceRaw].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return dateB - dateA
    })
  }, [attendanceRaw])

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login?redirect=/attendance')
    }
    // Redirect to dashboard if not approved (and not an admin)
    if (mounted && !isUserLoading && !isProfileLoading && user && profile && !profile.isApproved && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, isProfileLoading, profile, router, mounted, isAdmin])

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

  // Allow Admin OR Approved Students
  if (!isAdmin && profile && !profile.isApproved) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-32">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full text-center p-12 glass border-none rounded-[3rem] shadow-2xl">
              <div className="mx-auto w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-8">
                <AlertCircle size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Verification Required</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your profile is currently under review. Attendance history will be available once your registration is approved.
              </p>
              <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl h-12 px-8 font-bold">
                Back to Home
              </Button>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  const totalSessions = sessions?.length || 0;
  const attendedSessions = attendance?.length || 0;
  const attendancePercentage = totalSessions > 0 ? Math.min(100, (attendedSessions / totalSessions) * 100) : 0;
  const isBelowThreshold = attendancePercentage < 75 && totalSessions > 0;

  // Unique student identity token format recognized by Admin scanner
  const studentQrValue = JSON.stringify({
    uid: user.uid,
    studentId: profile?.studentId || 'ADMIN-PREVIEW',
    name: isAdmin ? 'System Administrator' : `${profile?.firstName} ${profile?.lastName}`,
    type: 'techxera-student-id',
    issuedAt: profile?.enrollmentDate || new Date().toISOString()
  })

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-32">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={16} /> Campus Identity Verified
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">
              <SplitText 
                text="Presence Tracker"
                tag="span"
                duration={0.6}
                delay={30}
              />
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
              Show your unique identity QR to the campus administrator to verify your class attendance.
            </p>
          </div>
          
          <Dialog open={isIDModalOpen} onOpenChange={setIsIDModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-16 px-10 bg-primary text-white hover:bg-primary/90 rounded-[2rem] text-lg font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                <QrCode className="mr-3" /> Show My Identity QR
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[3rem] p-10 border-none glass">
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-headline font-bold mb-2">Campus Identity QR</DialogTitle>
                <p className="text-muted-foreground">Present this code to the admin scanner</p>
              </DialogHeader>
              <div className="flex flex-col items-center gap-8 py-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative p-6 bg-white rounded-[2rem] shadow-2xl border-4 border-primary/10"
                >
                  <QRCodeSVG 
                    value={studentQrValue}
                    size={250}
                    level="H"
                    includeMargin
                  />
                </motion.div>
                
                <div className="w-full space-y-2 text-center">
                  <p className="font-bold text-xl">{isAdmin ? 'Administrator' : `${profile?.firstName} ${profile?.lastName}`}</p>
                  <p className="text-primary font-black uppercase tracking-widest text-xs">ID: {isAdmin ? 'ROOT' : profile?.studentId}</p>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl w-full flex items-center gap-3 text-xs text-primary border border-primary/20">
                  <ShieldCheck size={16} />
                  <p className="font-medium">Secure identity token. Attendance is committed instantly upon scanning.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-8">
            <Card className="glass border-none rounded-[3rem] shadow-xl overflow-hidden group">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                  <TrendingUp className="text-primary" /> Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Attendance</span>
                    <span className={`font-black text-4xl ${isBelowThreshold ? 'text-destructive' : 'text-primary'}`}>
                      {attendancePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={attendancePercentage} className={`h-4 ${isBelowThreshold ? 'bg-destructive/10' : 'bg-muted'}`} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-6 bg-muted/30 rounded-3xl border border-white/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Attended</p>
                    <p className="text-2xl font-black text-foreground">{attendedSessions}</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-white/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Total Classes</p>
                    <p className="text-2xl font-black text-foreground">{totalSessions}</p>
                  </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Status</p>
                  <p className={`text-xs font-black uppercase ${isBelowThreshold ? 'text-destructive' : 'text-green-500'}`}>
                    {isBelowThreshold ? 'At Risk' : 'Excellent'}
                  </p>
                </div>

                <div className="pt-6 border-t border-border/20">
                  <div className="flex flex-col items-center p-6 bg-white/50 dark:bg-black/20 rounded-[2rem] border border-white/40 shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Your Unique Badge</p>
                    <QRCodeSVG 
                      value={studentQrValue}
                      size={120}
                      level="M"
                      className="opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <p className="mt-4 text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Verification Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 bg-primary/5 rounded-[3rem] border border-primary/10 flex items-start gap-4">
              <Sparkles className="text-primary shrink-0 mt-1" size={20} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Dynamic Credential</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Each student QR is cryptographically unique. It serves as your digital key for all campus validation points.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="glass border-none rounded-[3.5rem] shadow-xl overflow-hidden min-h-[600px]">
              <CardHeader className="p-10 border-b border-border/20 bg-white/30">
                <CardTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                  <Clock className="text-primary" /> Verified History
                </CardTitle>
                <CardDescription>Official records of sessions recorded by campus administrators</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isAttendanceLoading ? (
                  <div className="py-32 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Accessing Logs...</p>
                  </div>
                ) : attendance && attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-muted/20 border-b border-border/10">
                          <th className="px-10 py-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Session / ID</th>
                          <th className="py-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                          <th className="py-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Verified At</th>
                          <th className="px-10 py-6 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((record, i) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={record.id} 
                            className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors group"
                          >
                            <td className="px-10 py-6">
                              <p className="font-bold text-lg leading-none">Session {record.sessionId?.slice(-4) || 'N/A'}</p>
                              <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Academic Point: VERIFIED</p>
                            </td>
                            <td className="py-6 text-sm font-bold text-foreground">
                              {record.timestamp ? format(new Date(record.timestamp), 'MMM d, yyyy') : 'N/A'}
                            </td>
                            <td className="py-6 text-sm font-medium text-muted-foreground">
                              {record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : 'N/A'}
                            </td>
                            <td className="px-10 py-6 text-right">
                              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20 shadow-sm">
                                <CheckCircle2 size={12} /> Present
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                    <div className="p-8 bg-muted/20 rounded-[2.5rem] mb-6">
                      <Calendar size={64} className="text-muted-foreground/20" />
                    </div>
                    <h3 className="text-2xl font-headline font-bold text-muted-foreground mb-2">No Records Found</h3>
                    <p className="text-muted-foreground max-w-sm font-medium text-sm leading-relaxed">
                      Present your unique Identity QR during class sessions to mark your attendance in real-time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
