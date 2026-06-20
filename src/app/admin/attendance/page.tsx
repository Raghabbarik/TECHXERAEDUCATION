
"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, Clock, Calendar, 
  Trash2, Loader2, ShieldCheck, Camera,
  CheckCircle2, ArrowLeft, RefreshCw
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase'
import { collection, doc, setDoc, deleteDoc, query, orderBy, where, getDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'
import Link from 'next/link'


export default function AdminAttendancePage() {
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [newSession, setNewSession] = useState({
    className: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    description: ''
  })
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const teacherDocRef = useMemoFirebase(() => (db && user ? doc(db, 'teachers', user.uid) : null), [db, user])
  const { data: teacherData, isLoading: isTeacherLoading } = useDoc(teacherDocRef)
  const isAuthorizedAdmin = teacherData?.role === 'admin' || user?.email?.toLowerCase() === 'rraghabbarik@gmail.com'

  useEffect(() => {
    setMounted(true)
  }, [])

  const sessionsQuery = useMemoFirebase(() => (db ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc')) : null), [db])
  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery)

  const attendanceQuery = useMemoFirebase(() => (db && selectedSessionId ? query(collection(db, 'attendance'), where('sessionId', '==', selectedSessionId)) : null), [db, selectedSessionId])
  const { data: attendance } = useCollection(attendanceQuery)

  const allAttendanceQuery = useMemoFirebase(() => (db ? query(collection(db, 'attendance'), orderBy('timestamp', 'desc')) : null), [db])
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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...newSession,
      id,
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    const docRef = doc(db, 'sessions', id)
    
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Session Established", description: "Class session added to registry." })
        setIsDialogOpen(false)
        setNewSession({
          className: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '09:00',
          endTime: '10:00',
          description: ''
        })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  const handleDeleteSession = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'sessions', id))
      toast({ title: "Session Removed" })
      if (selectedSessionId === id) setSelectedSessionId(null)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  // Scanner Logic - Optimized Initialization
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScannerOpen && selectedSessionId && db) {
      const timer = setTimeout(() => {
        const element = document.getElementById("admin-attendance-qr-reader");
        if (!element) return;

        scanner = new Html5QrcodeScanner(
          "admin-attendance-qr-reader",
          { fps: 15, qrbox: { width: 250, height: 250 } },
          false
        );

        const onScanSuccess = async (decodedText: string) => {
          try {
            const studentData = JSON.parse(decodedText)
            if (studentData.type !== 'techxera-student-id') return

            const recordId = `${studentData.uid}_${selectedSessionId}`
            const attendanceRef = doc(db, 'attendance', recordId)
            
            const existing = await getDoc(attendanceRef)
            if (existing.exists()) {
              toast({ title: "Already Logged", description: `${studentData.name} is present.` })
              return
            }

            const payload = {
              id: recordId,
              sessionId: selectedSessionId,
              studentUid: studentData.uid,
              studentId: studentData.studentId,
              studentName: studentData.name,
              timestamp: new Date().toISOString(),
              status: 'present'
            };

            setDoc(attendanceRef, payload)
              .then(() => {
                toast({ title: "Check-in Confirmed", description: `Scanned ID for ${studentData.name}` })
              })
              .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                  path: attendanceRef.path,
                  operation: 'create',
                  requestResourceData: payload,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
              });

          } catch (err) {
            console.warn("Scan processing error:", err)
          }
        }

        scanner.render(onScanSuccess, (err) => {})
        scannerRef.current = scanner
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn(e))
          scannerRef.current = null
        }
      }
    }
  }, [isScannerOpen, selectedSessionId, db, toast])

  const activeSession = sessions?.find(s => s.id === selectedSessionId)

  if (!mounted || isUserLoading || isTeacherLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>
  if (!isAuthorizedAdmin) return <div className="min-h-screen flex items-center justify-center font-bold">Access Denied</div>

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 pt-32 pb-24 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <Link href="/admin" className="text-primary hover:underline flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              <ArrowLeft size={14} /> Back to Hub
            </Link>
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter">Attendance Manager</h1>
            <p className="text-muted-foreground font-medium max-w-lg">Create class sessions and scan student identity tokens in real-time.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 bg-primary rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 flex-1 md:flex-none">
                  <Plus className="mr-2" /> New Session
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-10">
                <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">Initialize Class</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateSession} className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label>Module Name</Label>
                    <Input required placeholder="e.g. Data Structures" value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input type="time" required value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg">Create Session</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
              <Clock className="text-primary" /> Active Registries
            </h2>
            <div className="grid gap-6">
              {sessionsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : sessions?.length === 0 ? (
                <div className="text-center py-24 border-4 border-dashed rounded-[3rem] bg-muted/20">
                  <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No active sessions found.</p>
                </div>
              ) : sessions?.map((session) => (
                <Card key={session.id} className={`border-none ${selectedSessionId === session.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-white dark:bg-card/40'} rounded-[2.5rem] shadow-lg transition-all`}>
                  <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-2xl tracking-tight">{session.className}</h3>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Active</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground font-bold">
                        <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {session.startTime}</span>
                        <span className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> {session.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button 
                        onClick={() => {
                          setSelectedSessionId(session.id)
                          setIsScannerOpen(true)
                        }}
                        className="flex-1 md:flex-none h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold"
                      >
                        <Camera className="mr-2" size={18} /> Launch Scanner
                      </Button>
                      <Button 
                        onClick={() => handleDeleteSession(session.id)}
                        size="icon" 
                        variant="ghost" 
                        className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <Card className="glass border-none rounded-[3.5rem] shadow-2xl overflow-hidden min-h-[500px]">
              <CardHeader className="bg-primary/5 border-b p-10">
                <CardTitle className="text-2xl font-headline font-bold">Presence Monitor</CardTitle>
                <CardDescription className="text-sm font-medium">Real-time student check-in log</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                {selectedSessionId ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between font-bold text-sm uppercase tracking-widest">
                        <span>Total Scanned</span>
                        <span className="text-primary">{attendance?.length || 0}</span>
                      </div>
                      <Progress value={((attendance?.length || 0) / 60) * 100} className="h-3" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b pb-2">Successfully Verified</h4>
                      <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {attendance?.map(record => (
                          <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={record.id} 
                            className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white/40 shadow-sm"
                          >
                            <div className="text-sm font-bold tracking-tight">{record.studentName}</div>
                            <div className="text-[10px] text-muted-foreground font-black uppercase">{format(new Date(record.timestamp), 'h:mm a')}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-24 text-center text-muted-foreground italic flex flex-col items-center gap-6">
                    <CheckCircle2 size={48} className="opacity-10" />
                    <p className="text-sm font-medium">Select a module session to monitor real-time presence.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12">
          <Card className="glass border-none rounded-[3.5rem] shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b p-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-headline font-bold">Global Attendance Summary</CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">Aggregated presence tracking across all active sessions</CardDescription>
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
        </div>
      </main>

      {/* Admin Scanner Modal */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-10 overflow-hidden">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-headline font-bold mb-2">Scanner: {activeSession?.className}</DialogTitle>
            <p className="text-muted-foreground font-medium">Position student's identity QR within the frame</p>
          </DialogHeader>
          <div className="flex flex-col items-center gap-8 py-6">
            <div id="admin-attendance-qr-reader" className="w-full rounded-[2.5rem] overflow-hidden border-4 border-primary/20 bg-muted/20 min-h-[300px]" />
            <div className="p-5 bg-primary/5 rounded-2xl w-full flex items-center gap-4 text-xs text-primary border border-primary/20">
              <ShieldCheck size={20} className="shrink-0" />
              <p className="font-medium leading-relaxed">Secure Admin Check-in Mode. Student credentials are validated instantly against campus records.</p>
            </div>
            <Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full h-12 rounded-xl font-bold">
              Terminate Scanner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
