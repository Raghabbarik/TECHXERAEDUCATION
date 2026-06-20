
"use client"

import React, { useEffect, useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GraduationCap, Award, BookOpen, Clock, TrendingUp, Loader2, Sparkles, AlertCircle, ShieldAlert, ShieldCheck, CreditCard, Copy, Check, Camera, LogOut, QrCode, Users, Calendar as CalendarIcon, CheckCircle2, Code, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase'
import { doc, updateDoc, collection, query, where, orderBy, limit } from 'firebase/firestore'
import { updateProfile, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { safeFormat } from '@/lib/security'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import SplitText from '@/components/SplitText'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'


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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" } }
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [newAvatarUrl, setNewAvatarUrl] = useState('')
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)

  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && teacherProfile?.role === 'admin') {
      router.push('/admin')
    }
  }, [teacherProfile, isUserLoading, isProfileLoading, router])

  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: studentProfile, isLoading: isStudentLoading } = useDoc(studentRef)

  const teacherRef = useMemoFirebase(() => (user && db ? doc(db, 'teachers', user.uid) : null), [user, db])
  const { data: teacherProfile, isLoading: isTeacherLoading } = useDoc(teacherRef)

  const profile = studentProfile || teacherProfile
  const isProfileLoading = isStudentLoading || isTeacherLoading

  const resultsQuery = useMemoFirebase(() => (user && profile?.isApproved && db ? collection(db, 'students', user.uid, 'results') : null), [user, profile, db])
  const { data: results, isLoading: isResultsLoading } = useCollection(resultsQuery)

  const certsQuery = useMemoFirebase(() => (user && db ? query(collection(db, 'certificates'), where('studentId', '==', user.uid)) : null), [user, db])
  const { data: myCertificates } = useCollection(certsQuery)

  const projectsQuery = useMemoFirebase(() => (db ? query(collection(db, 'projects'), limit(10)) : null), [db])
  const { data: activeProjects } = useCollection(projectsQuery)

  const allSessionsQuery = useMemoFirebase(() => (db && (profile?.role === 'teacher' || profile?.role === 'admin') ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(20)) : null), [db, profile])
  const { data: allSessions } = useCollection(allSessionsQuery)

  const allAttendanceQuery = useMemoFirebase(() => (db && (profile?.role === 'teacher' || profile?.role === 'admin') ? query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(100)) : null), [db, profile])
  const { data: allAttendance } = useCollection(allAttendanceQuery)

  const attendanceSummary = useMemo(() => {
    if (!allAttendance) return []
    const summary: Record<string, { count: number, name: string }> = {}
    allAttendance.forEach(record => {
      if (!summary[record.studentId]) {
        summary[record.studentId] = { count: 0, name: record.studentName }
      }
      summary[record.studentId].count++
    })
    return Object.entries(summary).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.count - a.count)
  }, [allAttendance])

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router, mounted])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Roll Number copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !newAvatarUrl.trim()) return

    setIsUpdatingAvatar(true)
    try {
      await updateProfile(user, { photoURL: newAvatarUrl.trim() })
      const studentDocRef = doc(db, 'students', user.uid)
      await updateDoc(studentDocRef, { photoURL: newAvatarUrl.trim() })

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been changed successfully.",
      })
      setIsAvatarDialogOpen(false)
      setNewAvatarUrl('')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile picture.",
      })
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

  if (!profile && !isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-32">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full text-center p-12 glass border-none rounded-[3rem] shadow-2xl">
              <div className="mx-auto w-24 h-24 bg-destructive/10 text-destructive rounded-[2rem] flex items-center justify-center mb-8">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Access Restricted</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your student record could not be found or has been removed from the system. Access to academic records requires an active profile.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={handleLogout} variant="destructive" className="rounded-xl h-12 px-8 font-bold">
                  <LogOut size={18} className="mr-2" /> Log Out
                </Button>
                <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl h-12 px-8 font-bold">
                  Home
                </Button>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  if (profile && !profile.isApproved) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-32">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full text-center p-12 glass border-none rounded-[3rem] shadow-2xl">
              <div className="mx-auto w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-8">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Account Pending Approval</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your registration has been received. A campus administrator must review and approve your account before you can access academic records.
              </p>
              <div className="p-6 bg-muted/50 rounded-2xl flex items-center gap-4 text-left border border-border">
                <AlertCircle className="text-primary shrink-0" />
                <p className="text-sm font-medium">Please contact the IT department if this takes longer than 24 hours. Your assigned Roll No is <span className="text-primary font-bold">{profile?.studentId}</span>.</p>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  const chartData = results?.map(r => ({
    name: r.semester,
    score: r.marks,
    color: 'hsl(var(--primary))'
  })) || []

  const currentPhotoURL = user?.photoURL || profile?.photoURL || `https://picsum.photos/seed/${user.uid}/300/300`

  if (profile?.role === 'teacher' || profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-32 space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between"
          >
            <div className="flex items-center gap-10">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer"
              >
                <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
                  <img 
                    src={currentPhotoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                  <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2rem]">
                      <DialogHeader>
                        <DialogTitle>Update Profile Picture</DialogTitle>
                        <DialogDescription>
                          Enter a URL for your new profile picture.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateAvatar} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="photoUrl">Image URL</Label>
                          <Input 
                            id="photoUrl" 
                            placeholder="https://..." 
                            value={newAvatarUrl}
                            onChange={(e) => setNewAvatarUrl(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isUpdatingAvatar} className="rounded-xl font-bold">
                            {isUpdatingAvatar ? <Loader2 className="animate-spin mr-2" /> : null}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-lg border-2 border-white">
                  <Sparkles size={20} />
                </div>
              </motion.div>
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter">
                  <SplitText 
                    text={`Welcome, ${profile?.firstName || 'Teacher'}!`}
                    tag="span"
                    duration={0.6}
                    delay={30}
                  />
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2">
                    <CreditCard size={14} /> EMP ID: {profile?.employeeId || 'N/A'}
                    <button onClick={() => copyToClipboard(profile?.employeeId || '')} className="hover:text-primary/70 transition-colors">
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="bg-muted text-muted-foreground px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-border">
                    <Award size={14} /> FACULTY PORTAL
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <motion.div variants={itemVariant} className="space-y-8">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                <Clock className="text-primary" /> Upcoming Classes
              </h2>
              <div className="grid gap-6">
                {!allSessions || allSessions.length === 0 ? (
                  <div className="text-center py-20 border-4 border-dashed rounded-[3rem] bg-muted/20">
                    <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No active sessions found.</p>
                  </div>
                ) : allSessions?.slice(0, 5).map((session) => (
                  <Card key={session.id} className="border-none bg-white dark:bg-card/40 rounded-[2.5rem] shadow-lg transition-all hover:shadow-xl">
                    <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-2xl tracking-tight">{session.className}</h3>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground font-bold">
                          <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {session.startTime}</span>
                          <span className="flex items-center gap-2"><CalendarIcon size={14} className="text-primary" /> {session.date}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariant} className="space-y-8">
              <Card className="glass border-none rounded-[3.5rem] shadow-2xl overflow-hidden min-h-[500px]">
                <CardHeader className="bg-primary/5 border-b p-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-headline font-bold">Recent Sign-ins</CardTitle>
                      <p className="text-muted-foreground text-sm font-medium mt-1">Live campus attendance feed</p>
                    </div>
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                      <Users size={28} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  {!allAttendance || allAttendance.length === 0 ? (
                    <div className="py-24 text-center text-muted-foreground italic flex flex-col items-center gap-6">
                      <CheckCircle2 size={48} className="opacity-10" />
                      <p className="text-sm font-medium">No recent student registrations.</p>
                    </div>
                  ) : (
                    <div className="max-h-[450px] overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                      {allAttendance?.slice(0, 20).map(record => (
                        <div key={record.id} className="flex items-center justify-between p-5 bg-white/50 dark:bg-black/20 rounded-2xl border border-white/40 shadow-sm">
                          <div>
                            <div className="text-base font-bold tracking-tight">{record.studentName}</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{record.studentId}</div>
                          </div>
                          <div className="text-xs text-primary font-black uppercase tracking-widest">{safeFormat(record.timestamp, d => format(d, 'h:mm a'))}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Card className="glass border-none rounded-[3.5rem] shadow-2xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold">Global Attendance Summary</CardTitle>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Aggregated presence tracking across all active sessions</p>
                  </div>
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                    <CheckCircle2 size={28} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <div className="border rounded-[2rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                  <Table className="min-w-full">
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow className="border-none">
                        <TableHead className="h-16 px-10 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Student</TableHead>
                        <TableHead className="h-16 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Roll No</TableHead>
                        <TableHead className="h-16 px-10 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-right">Total Attended Classes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceSummary.map((student) => (
                        <TableRow key={student.id} className="border-b border-border/10">
                          <TableCell className="px-10 py-6 font-bold text-base">{student.name}</TableCell>
                          <TableCell className="py-6 text-muted-foreground font-medium uppercase text-xs">{student.id}</TableCell>
                          <TableCell className="px-10 py-6 text-right">
                            <Badge className="bg-primary text-white border-none text-base px-4 py-1 rounded-xl">{student.count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {attendanceSummary.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="h-32 text-center text-muted-foreground uppercase tracking-widest text-xs font-bold">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-32 space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between"
        >
          <div className="flex items-center gap-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative group cursor-pointer"
            >
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
                <img 
                  src={currentPhotoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={24} className="text-white" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle>Update Profile Picture</DialogTitle>
                      <DialogDescription>
                        Enter a URL for your new profile picture.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateAvatar} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="photoUrl">Image URL</Label>
                        <Input 
                          id="photoUrl" 
                          placeholder="https://..." 
                          value={newAvatarUrl}
                          onChange={(e) => setNewAvatarUrl(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isUpdatingAvatar} className="rounded-xl font-bold">
                          {isUpdatingAvatar ? <Loader2 className="animate-spin mr-2" /> : null}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-lg border-2 border-white">
                <Sparkles size={20} />
              </div>
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter">
                <SplitText 
                  text={`Hello, ${profile?.firstName || 'Student'}!`}
                  tag="span"
                  duration={0.6}
                  delay={30}
                />
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2">
                  <CreditCard size={14} /> {profile?.role ? 'EMP ID' : 'ROLL NO'}: {profile?.studentId || profile?.employeeId || 'N/A'}
                  <button onClick={() => copyToClipboard(profile?.studentId || profile?.employeeId || '')} className="hover:text-primary/70 transition-colors">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="bg-muted text-muted-foreground px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-border">
                  <GraduationCap size={14} /> {profile?.currentSemester || 'SEMESTER 1'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
          <motion.div variants={itemVariant} className="lg:col-span-2">
            <Card className="glass border-none rounded-[3rem] shadow-lg overflow-hidden h-full">
              <CardHeader className="p-8 md:p-12 border-b border-border/40 bg-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Academic Engine</CardTitle>
                    <p className="text-muted-foreground text-base md:text-lg font-medium mt-2">Real-time performance analytics</p>
                  </div>
                  <div className="p-4 md:p-5 bg-primary/10 text-primary rounded-2xl">
                    <TrendingUp size={32} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 md:p-12 h-[400px] md:h-[500px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 13, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 13, fontWeight: 700 }} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(227, 106, 106, 0.05)' }}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.1)', padding: '24px' }}
                      />
                      <Bar dataKey="score" radius={[15, 15, 0, 0]} barSize={60}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-6">
                    <div className="p-10 bg-muted/50 rounded-full"><Clock size={64} className="opacity-20" /></div>
                    <p className="font-bold uppercase tracking-widest text-sm">No analytical data found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-6 lg:space-y-8">
            <Card className="glass border-none rounded-[2.5rem] shadow-xl overflow-hidden p-6 md:p-8 relative">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-xl md:text-2xl font-bold font-headline flex items-center gap-3">
                  <Award className="text-yellow-500" /> Certificates
                </h2>
              </div>
              <div className="space-y-4 relative z-10 max-h-[250px] overflow-y-auto scrollbar-thin pr-2">
                {!myCertificates?.length ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-[1.5rem] bg-muted/20">
                    <Award size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No certificates yet</p>
                  </div>
                ) : (
                  myCertificates.map((cert: any) => (
                    <div key={cert.id} className="flex flex-col p-5 bg-white/50 dark:bg-black/20 rounded-[1.5rem] border border-white/40 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm md:text-base leading-tight pr-4">{cert.title}</span>
                        <Award size={20} className="text-yellow-500 shrink-0" />
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{safeFormat(cert.issueDate, d => format(d, 'MMM yyyy'))}</span>
                        <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-primary text-[10px] uppercase font-black tracking-widest hover:text-primary/70 bg-primary/10 px-3 py-1 rounded-full">
                          Download
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/resources')}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-card/40 text-foreground rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-border/50 h-full"
              >
                <div className="p-3 md:p-4 bg-primary/5 rounded-2xl mb-3 text-primary">
                  <BookOpen size={28} />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Library</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/projects')}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-card/40 text-foreground rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-border/50 h-full"
              >
                <div className="p-3 md:p-4 bg-primary/5 rounded-2xl mb-3 text-primary">
                  <Code size={28} />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Projects</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/notices')}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-card/40 text-foreground rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-border/50 h-full"
              >
                <div className="p-3 md:p-4 bg-primary/5 rounded-2xl mb-3 text-primary">
                  <Clock size={28} />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Updates</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/internship')}
                className="flex flex-col items-center justify-center p-6 bg-primary text-white rounded-[2rem] shadow-xl shadow-primary/20 transition-all border-none h-full"
              >
                <div className="p-3 md:p-4 bg-white/20 rounded-2xl mb-3">
                  <Briefcase size={28} />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Internship</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
