
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { TechXeraLogo } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, GraduationCap, Users, CheckCircle, 
  Search, ClipboardList, Settings as SettingsIcon, 
  LogOut, Home, ArrowRight, Bell, HelpCircle,
  Plus, LifeBuoy, BookOpen, Camera, Trash2, 
  Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Clock, Calendar as CalendarIcon, FileText, Edit,
  ShieldCheck, Layout, ImageIcon, Globe, Send, XCircle, X,
  Heart, Sparkles, Map, Zap, Award, Code, MessageSquare, Mail
} from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useAuth, useCollection } from '@/firebase'
import { collection, doc, setDoc, deleteDoc, query, orderBy, where, updateDoc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TechBackground from '@/components/TechBackground'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'
import { cn } from '@/lib/utils'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

function StudentGradeAction({ student, examId, onEdit, db }: { student: any, examId: string, onEdit: (student: any, existingGrade: any) => void, db: any }) {
  const resultRef = useMemoFirebase(() => (db && student.id && examId ? doc(db, 'students', student.id, 'results', examId) : null), [db, student.id, examId]);
  const { data: existingGrade } = useDoc(resultRef);

  return (
    <Button 
      onClick={() => onEdit(student, existingGrade)}
      variant="ghost" 
      className={cn(
        "h-8 md:h-10 px-2 md:px-4 rounded-xl font-bold text-[9px] md:text-xs gap-2",
        existingGrade ? "text-primary bg-primary/5 hover:bg-primary/10" : ""
      )}
    >
      <Edit size={14} /> 
      {existingGrade ? "Edit Grade" : "Update Grade"}
    </Button>
  );
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('results')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedExamCycle, setSelectedExamCycle] = useState<string | null>(null)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [scannedStudent, setScannedStudent] = useState<any | null>(null)
  
  const [newSession, setNewSession] = useState({
    className: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    description: ''
  })

  const [brandingForm, setBrandingForm] = useState({
    siteName: '',
    logoUrl: '',
    faviconUrl: '',
    heroDescription: ''
  })

  const [landingPageForm, setLandingPageForm] = useState({
    trustSectionEnabled: true,
    trustTeamImageUrl: '',
    trustScore: 90,
    trustRatingsCount: '1,548',
    trustDescription: 'Get help from our friendly supporters! Our support team answers your questions by email or directly from your student hub.',
    trustPartnerLogos: ''
  })

  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null)
  const [materialForm, setMaterialForm] = useState({
    title: '',
    subject: '',
    semester: 'Semester 1',
    materialType: 'Notes',
    fileUrl: '',
    thumbnailUrl: ''
  })

  const [isRoadmapDialogOpen, setIsRoadmapDialogOpen] = useState(false)
  const [roadmapForm, setRoadmapForm] = useState({
    title: '',
    field: '',
    description: '',
    fileUrl: '',
    thumbnailUrl: ''
  })

  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<any | null>(null)
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    description: '',
    isUrgent: false
  })

  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false)
  const [examForm, setExamForm] = useState({
    title: '',
    semester: 'Semester 1',
    examDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'upcoming' as 'upcoming' | 'active' | 'completed'
  })

  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<any | null>(null)
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: 'Programming',
    timeLimit: 10,
    questions: [{ id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]
  })

  const [isCertDialogOpen, setIsCertDialogOpen] = useState(false)
  const [certForm, setCertForm] = useState({
    title: '',
    studentId: '',
    fileUrl: '',
  })

  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [selectedStudentForGrade, setSelectedStudentForGrade] = useState<any | null>(null)
  const [gradeForm, setGradeForm] = useState({
    subject: '',
    marks: '',
    grade: '',
    remark: ''
  })

  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any | null>(null)
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    techStack: '',
    fileUrl: '',
    thumbnailUrl: ''
  })

  // Send Message state
  const [msgSearchQuery, setMsgSearchQuery] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [isSendingMsg, setIsSendingMsg] = useState(false)
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null)

  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const teacherDocRef = useMemoFirebase(() => (db && user ? doc(db, 'teachers', user.uid) : null), [db, user])
  const { data: teacherData } = useDoc(teacherDocRef)

  const isAuthorizedAdmin = user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase() || teacherData?.role === 'admin'

  useEffect(() => {
    if (mounted && !isUserLoading && teacherData !== undefined) {
      if (!user) {
        router.push('/admin/login')
      } else if (!isAuthorizedAdmin) {
        console.warn('Unauthorized access attempt:', { userEmail: user?.email, teacherRole: teacherData?.role })
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have admin permissions." })
        setTimeout(() => router.push('/'), 2000)
      }
    }
  }, [user, isUserLoading, router, mounted, isAuthorizedAdmin, toast, teacherData])

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: dbSettings } = useDoc(settingsRef)

  useEffect(() => {
    if (dbSettings) {
      setBrandingForm({
        siteName: dbSettings.siteName || '',
        logoUrl: dbSettings.logoUrl || '',
        faviconUrl: dbSettings.faviconUrl || '',
        heroDescription: dbSettings.heroDescription || ''
      })
      setLandingPageForm({
        trustSectionEnabled: dbSettings.trustSectionEnabled ?? true,
        trustTeamImageUrl: dbSettings.trustTeamImageUrl || '',
        trustScore: dbSettings.trustScore || 90,
        trustRatingsCount: dbSettings.trustRatingsCount || '1,548',
        trustDescription: dbSettings.trustDescription || 'Get help from our friendly supporters! Our support team answers your questions by email or directly from your student hub.',
        trustPartnerLogos: dbSettings.trustPartnerLogos || ''
      })
    }
  }, [dbSettings])

  const sessionsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery)

  const attendanceQuery = useMemoFirebase(() => (db && selectedSessionId && isAuthorizedAdmin ? query(collection(db, 'attendance'), where('sessionId', '==', selectedSessionId)) : null), [db, selectedSessionId, isAuthorizedAdmin])
  const { data: sessionAttendance } = useCollection(attendanceQuery)

  const allStudentsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'students'), orderBy('enrollmentDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allStudents } = useCollection(allStudentsQuery)

  const teachersQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'teachers'), orderBy('enrollmentDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allTeachers } = useCollection(teachersQuery)

  const examsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'exams'), orderBy('examDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allExams } = useCollection(examsQuery)

  const challengesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'challenges'), orderBy('createdAt', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allChallenges } = useCollection(challengesQuery)

  const supportQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'support_inquiries'), orderBy('timestamp', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: supportInquiries } = useCollection(supportQuery)

  const noticesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allNotices } = useCollection(noticesQuery)

  const materialsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allMaterials } = useCollection(materialsQuery)

  const roadmapsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'roadmaps'), orderBy('createdAt', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allRoadmaps } = useCollection(roadmapsQuery)

  const certificatesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'certificates')) : null), [db, isAuthorizedAdmin])
  const { data: allCertificates } = useCollection(certificatesQuery)

  const projectsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'projects')) : null), [db, isAuthorizedAdmin])
  const { data: allProjects } = useCollection(projectsQuery)

  const messagesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'messages'), orderBy('sentAt', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allMessages } = useCollection(messagesQuery)

  // Derived: filtered students for message tab
  const filteredMsgStudents = (allStudents || []).filter((s: any) =>
    `${s.firstName || ''} ${s.lastName || ''} ${s.email || ''}`.toLowerCase().includes(msgSearchQuery.toLowerCase())
  )

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const docRef = doc(db, 'settings', 'site-config')
    setDoc(docRef, brandingForm, { merge: true })
      .then(() => toast({ title: "Branding Updated" }))
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: brandingForm,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  const handleUpdateLandingPage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const docRef = doc(db, 'settings', 'site-config')
    setDoc(docRef, landingPageForm, { merge: true })
      .then(() => toast({ title: "Landing Page Updated", description: "Team & Trust section settings synchronized." }))
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: landingPageForm,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...newSession,
      id,
      status: 'active',
      createdAt: new Date().toISOString(),
      dynamicToken: Math.random().toString(36).substring(2, 10).toUpperCase()
    }
    const docRef = doc(db, 'sessions', id)
    
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Session Established" })
        setIsCreateDialogOpen(false)
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

  const handleApproveTeacher = async (teacherId: string, role: 'teacher' | 'admin') => {
    if (!db) return
    const docRef = doc(db, 'teachers', teacherId)
    updateDoc(docRef, { isApproved: true, status: 'approved', role })
      .then(() => toast({ title: `Teacher Approved as ${role}` }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isApproved: true, status: 'approved', role },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleRejectTeacher = async (teacherId: string) => {
    if (!db) return
    const docRef = doc(db, 'teachers', teacherId)
    updateDoc(docRef, { isApproved: false, status: 'rejected' })
      .then(() => toast({ title: "Teacher Rejected" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isApproved: false, status: 'rejected' },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!db) return
    if (!confirm("Permanently delete this teacher record?")) return
    const docRef = doc(db, 'teachers', teacherId)
    deleteDoc(docRef)
      .then(() => toast({ title: "Teacher Record Deleted" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleApproveStudent = async (studentId: string) => {
    if (!db) return
    const docRef = doc(db, 'students', studentId)
    updateDoc(docRef, { isApproved: true, status: 'approved' })
      .then(() => toast({ title: "Student Approved" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isApproved: true, status: 'approved' },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleRejectStudent = async (studentId: string) => {
    if (!db) return
    const docRef = doc(db, 'students', studentId)
    updateDoc(docRef, { isApproved: false, status: 'rejected' })
      .then(() => toast({ title: "Approval Revoked" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isApproved: false, status: 'rejected' },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!db) return
    if (!confirm("Permanently delete this student record?")) return
    
    const docRef = doc(db, 'students', studentId)
    deleteDoc(docRef)
      .then(() => toast({ title: "Record Deleted" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleResolveInquiry = async (id: string) => {
    if (!db) return
    const docRef = doc(db, 'support_inquiries', id)
    updateDoc(docRef, { status: 'resolved' })
      .then(() => toast({ title: "Inquiry Resolved" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { status: 'resolved' },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = editingProject?.id || Math.random().toString(36).substring(2, 9)
    const payload = {
      ...projectForm,
      id,
      createdAt: editingProject?.createdAt || new Date().toISOString()
    }
    const docRef = doc(db, 'projects', id)
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: editingProject ? "Project Updated" : "Project Added" })
        setIsProjectDialogOpen(false)
        setEditingProject(null)
        setProjectForm({ title: '', description: '', techStack: '', fileUrl: '', thumbnailUrl: '' })
      })
      .catch((err) => toast({ variant: "destructive", title: "Error", description: err.message }))
  }

  const handleEditProject = (project: any) => {
    setEditingProject(project)
    setProjectForm({
      title: project.title,
      description: project.description,
      techStack: project.techStack,
      fileUrl: project.fileUrl,
      thumbnailUrl: project.thumbnailUrl || ''
    })
    setIsProjectDialogOpen(true)
  }


  const handleDeleteProject = async (id: string) => {
    if (!db) return
    if (!confirm("Remove this project permanently?")) return
    deleteDoc(doc(db, 'projects', id))
      .then(() => toast({ title: "Project Deleted" }))
      .catch((err) => toast({ variant: "destructive", title: "Error", description: err.message }))
  }

  const handleDeleteMaterial = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'studyMaterials', id))
      toast({ title: "Material Removed" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material)
    setMaterialForm({
      title: material.title,
      subject: material.subject,
      semester: material.semester || 'Semester 1',
      materialType: material.materialType || 'Notes',
      fileUrl: material.fileUrl,
      thumbnailUrl: material.thumbnailUrl || ''
    })
    setIsMaterialDialogOpen(true)
  }

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    const id = editingMaterial?.id || Math.random().toString(36).substring(2, 9)
    const payload = {
      ...materialForm,
      id,
      uploadDate: editingMaterial?.uploadDate || new Date().toISOString()
    }

    const docRef = doc(db, 'studyMaterials', id)
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: editingMaterial ? "Material Updated" : "Material Added" })
        setIsMaterialDialogOpen(false)
        setEditingMaterial(null)
        setMaterialForm({ title: '', subject: '', semester: 'Semester 1', materialType: 'Notes', fileUrl: '', thumbnailUrl: '' })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: editingMaterial ? 'update' : 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleEditNotice = (notice: any) => {
    setEditingNotice(notice)
    setNoticeForm({
      title: notice.title,
      description: notice.description,
      isUrgent: notice.isUrgent || false
    })
    setIsNoticeDialogOpen(true)
  }

  const handleDeleteNotice = async (id: string) => {
    if (!db) return
    if (!confirm("Permanently remove this bulletin?")) return
    try {
      await deleteDoc(doc(db, 'notices', id))
      toast({ title: "Notice Removed" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    
    const id = editingNotice?.id || Math.random().toString(36).substring(2, 9)
    const payload = {
      ...noticeForm,
      id,
      publishDate: editingNotice?.publishDate || new Date().toISOString()
    }
    
    const docRef = doc(db, 'notices', id)
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: editingNotice ? "Notice Updated" : "Notice Published" })
        setIsNoticeDialogOpen(false)
        setEditingNotice(null)
        setNoticeForm({ title: '', description: '', isUrgent: false })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: editingNotice ? 'update' : 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...examForm,
      id,
      createdAt: new Date().toISOString()
    }
    const docRef = doc(db, 'exams', id)
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Exam Scheduled" })
        setIsExamDialogOpen(false)
        setExamForm({ title: '', semester: 'Semester 1', examDate: format(new Date(), 'yyyy-MM-dd'), status: 'upcoming' })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...certForm,
      id,
      issueDate: new Date().toISOString()
    }
    const docRef = doc(db, 'certificates', id)
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Certificate Assigned" })
        setIsCertDialogOpen(false)
        setCertForm({ title: '', studentId: '', fileUrl: '' })
      })
      .catch((error) => toast({ variant: "destructive", title: "Error", description: error.message }))
  }

  const handleDeleteCertificate = async (id: string) => {
    if (!db) return
    if (!confirm("Revoke this certificate?")) return
    await deleteDoc(doc(db, 'certificates', id))
    toast({ title: "Certificate Revoked" })
  }

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = editingChallenge?.id || Math.random().toString(36).substring(2, 9)
    
    const totalPoints = challengeForm.questions.reduce((sum, q) => sum + (q.points || 10), 0)
    
    const payload = {
      ...challengeForm,
      id,
      totalPoints,
      createdAt: editingChallenge?.createdAt || new Date().toISOString()
    }
    const docRef = doc(db, 'challenges', id)
    
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: editingChallenge ? "Challenge Updated" : "Challenge Created", description: `${challengeForm.title} is now available for students` })
        setIsChallengeDialogOpen(false)
        setEditingChallenge(null)
        setChallengeForm({
          title: '',
          description: '',
          difficulty: 'medium',
          category: 'Programming',
          timeLimit: 10,
          questions: [{ id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]
        })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: editingChallenge ? 'update' : 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleEditChallenge = (challenge: any) => {
    setEditingChallenge(challenge)
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category || 'Programming',
      timeLimit: challenge.timeLimit || 10,
      questions: challenge.questions || [{ id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]
    })
    setIsChallengeDialogOpen(true)
  }


  const handleDeleteChallenge = async (id: string) => {
    if (!db) return
    if (!confirm("Permanently remove this challenge?")) return
    try {
      await deleteDoc(doc(db, 'challenges', id))
      toast({ title: "Challenge Removed" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const addQuestionToChallengeForm = () => {
    const newQuestion = {
      id: (challengeForm.questions.length + 1).toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10
    }
    setChallengeForm({
      ...challengeForm,
      questions: [...challengeForm.questions, newQuestion]
    })
  }

  const removeQuestionFromChallengeForm = (index: number) => {
    setChallengeForm({
      ...challengeForm,
      questions: challengeForm.questions.filter((_, i) => i !== index)
    })
  }

  const updateQuestionInChallengeForm = (index: number, field: string, value: any) => {
    const updatedQuestions = [...challengeForm.questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    setChallengeForm({
      ...challengeForm,
      questions: updatedQuestions
    })
  }

  const handleCreateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...roadmapForm,
      id,
      createdAt: new Date().toISOString()
    }
    const docRef = doc(db, 'roadmaps', id)
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Roadmap Published" })
        setIsRoadmapDialogOpen(false)
        setRoadmapForm({ title: '', field: '', description: '', fileUrl: '', thumbnailUrl: '' })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleDeleteRoadmap = async (id: string) => {
    if (!db) return
    if (!confirm("Permanently remove this roadmap?")) return
    try {
      await deleteDoc(doc(db, 'roadmaps', id))
      toast({ title: "Roadmap Removed" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  // --- Send Message Handlers ---
  const handleToggleRecipient = (studentId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    )
  }

  const handleSelectAllMsg = () => {
    const ids = filteredMsgStudents.map((s: any) => s.id)
    const allSelected = ids.length > 0 && ids.every((id: string) => selectedRecipients.includes(id))
    setSelectedRecipients(allSelected ? [] : ids)
  }

  const handleSendViaEmail = async () => {
    if (selectedRecipients.length === 0 || !msgBody.trim()) {
      toast({ variant: 'destructive', title: 'Incomplete', description: 'Select recipients and write a message.' })
      return
    }
    setIsSendingMsg(true)
    const recipients = (allStudents || []).filter((s: any) => selectedRecipients.includes(s.id))
    const emails = recipients.map((s: any) => s.email).filter(Boolean)

    if (emails.length === 0) {
      toast({ variant: 'destructive', title: 'No Emails Found', description: 'Selected students have no email addresses on record.' })
      setIsSendingMsg(false)
      return
    }

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emails, subject: msgSubject, body: msgBody }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to send')

      // Log to Firestore
      if (db) {
        const id = Math.random().toString(36).substring(2, 9)
        await setDoc(doc(db, 'messages', id), {
          id, subject: msgSubject, body: msgBody,
          recipientIds: selectedRecipients, recipientEmails: emails,
          sentAt: new Date().toISOString(), sentBy: user?.email, channel: 'email',
          status: data.sent > 0 ? 'sent' : 'failed'
        })
      }

      toast({ title: '✅ Emails Sent!', description: data.message })
      setSelectedRecipients([])
      setMsgSubject('')
      setMsgBody('')
    } catch (err: any) {
      toast({ variant: 'destructive', title: '❌ Email Failed', description: err.message })
    } finally {
      setIsSendingMsg(false)
    }
  }

  const handleSendViaWhatsApp = async () => {
    if (selectedRecipients.length === 0 || !msgBody.trim()) {
      toast({ variant: 'destructive', title: 'Incomplete', description: 'Select recipients and write a message.' })
      return
    }
    const text = msgSubject ? `*${msgSubject}*\n\n${msgBody}` : msgBody
    if (db) {
      const id = Math.random().toString(36).substring(2, 9)
      await setDoc(doc(db, 'messages', id), {
        id, subject: msgSubject, body: msgBody,
        recipientIds: selectedRecipients,
        sentAt: new Date().toISOString(), sentBy: user?.email, channel: 'whatsapp'
      })
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    toast({ title: '✅ WhatsApp Opened', description: `Message logged for ${selectedRecipients.length} recipient(s).` })
    setSelectedRecipients([])
    setMsgSubject('')
    setMsgBody('')
  }

  const calculateGrade = (marks: number): string => {
    if (marks >= 90) return 'O';
    if (marks >= 80) return 'A+';
    if (marks >= 70) return 'A';
    if (marks >= 60) return 'B+';
    if (marks >= 50) return 'B';
    if (marks >= 40) return 'C';
    if (marks >= 33) return 'P';
    return 'F';
  }

  const handleUpdateGradeClick = (student: any, existingResult?: any) => {
    const selectedExam = allExams?.find(ex => ex.id === selectedExamCycle)
    setSelectedStudentForGrade(student)
    setGradeForm({ 
      subject: existingResult?.subject || selectedExam?.title || '', 
      marks: existingResult?.marks?.toString() || '', 
      grade: existingResult?.grade || '',
      remark: existingResult?.remark || ''
    })
    setIsGradeDialogOpen(true)
  }

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !selectedStudentForGrade || !selectedExamCycle) return

    const marksNum = parseInt(gradeForm.marks)
    if (isNaN(marksNum)) {
      toast({ variant: "destructive", title: "Invalid Data" })
      return
    }

    const exam = allExams?.find(ex => ex.id === selectedExamCycle)
    const payload = {
      subject: gradeForm.subject || exam?.title || 'Examination',
      marks: marksNum,
      grade: gradeForm.grade || calculateGrade(marksNum),
      remark: gradeForm.remark || '',
      examId: selectedExamCycle,
      examTitle: exam?.title || 'Assessment',
      semester: exam?.semester || selectedStudentForGrade.currentSemester || 'Semester 1',
      examDate: exam?.examDate || new Date().toISOString(),
      timestamp: new Date().toISOString(),
      studentUid: selectedStudentForGrade.id
    }

    const resultDocRef = doc(db, 'students', selectedStudentForGrade.id, 'results', selectedExamCycle)
    const studentDocRef = doc(db, 'students', selectedStudentForGrade.id)
    
    setDoc(resultDocRef, payload, { merge: true })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: resultDocRef.path,
          operation: 'update',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

    updateDoc(studentDocRef, { isApproved: true, status: 'approved' })
      .catch(() => console.warn("Auto-approval failed."));

    toast({ title: "Result Archived" })
    setIsGradeDialogOpen(false)
    setGradeForm({ subject: '', marks: '', grade: '', remark: '' })
  }

  const handleGlobalCreate = () => {
    if (activeTab === 'repository') {
      setEditingMaterial(null)
      setMaterialForm({ title: '', subject: '', semester: 'Semester 1', materialType: 'Notes', fileUrl: '', thumbnailUrl: '' })
      setIsMaterialDialogOpen(true)
    } else if (activeTab === 'notices') {
      setEditingNotice(null)
      setNoticeForm({ title: '', description: '', isUrgent: false })
      setIsNoticeDialogOpen(true)
    } else if (activeTab === 'exams') {
      setIsExamDialogOpen(true)
    } else if (activeTab === 'attendance') {
      setIsCreateDialogOpen(true)
    }
  }

  const handleConfirmAttendance = async () => {
    if (!db || !selectedSessionId || !scannedStudent) return

    const recordId = `${scannedStudent.uid}_${selectedSessionId}`
    const attendanceRef = doc(db, 'attendance', recordId)
    
    const existing = await getDoc(attendanceRef)
    if (existing.exists()) {
      toast({ title: "Already Logged" })
      setScannedStudent(null)
      return
    }

    const sessionDoc = await getDoc(doc(db, 'sessions', selectedSessionId));
    const dynamicToken = sessionDoc.exists() ? sessionDoc.data().dynamicToken : '';

    const payload = {
      id: recordId,
      sessionId: selectedSessionId,
      studentUid: scannedStudent.uid,
      studentId: scannedStudent.studentId,
      studentName: scannedStudent.name,
      timestamp: new Date().toISOString(),
      status: 'present',
      tokenUsed: dynamicToken
    };

    setDoc(attendanceRef, payload)
      .then(() => {
        toast({ title: "Presence Verified" })
        setScannedStudent(null)
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: attendanceRef.path,
          operation: 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isScannerOpen && selectedSessionId && db && !scannedStudent) {
      const initScanner = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop()); 
          setHasCameraPermission(true);

          const timer = setTimeout(() => {
            const element = document.getElementById("admin-attendance-scan-reader");
            if (!element) return;

            scanner = new Html5QrcodeScanner(
              "admin-attendance-scan-reader",
              { fps: 15, qrbox: { width: 250, height: 250 } },
              false
            );

            const onScanSuccess = (decodedText: string) => {
              try {
                const studentData = JSON.parse(decodedText)
                if (studentData.type !== 'techxera-student-id') return
                setScannedStudent(studentData);
              } catch (err) {
                console.warn("QR parsing failed:", err)
              }
            }

            scanner.render(onScanSuccess, (err) => {})
            scannerRef.current = scanner
          }, 600);
        } catch (err) {
          setHasCameraPermission(false);
        }
      }

      initScanner();

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn("Scanner cleanup warning:", e))
          scannerRef.current = null
        }
      }
    }
  }, [isScannerOpen, selectedSessionId, db, scannedStudent])

  const activeSession = sessions?.find(s => s.id === selectedSessionId)

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Shield className="animate-pulse text-primary" size={64} /></div>
  if (!user || !isAuthorizedAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="text-destructive" /> Access Denied</CardTitle>
          <CardDescription>You don't have admin permissions to access this panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Contact your administrator for access.</p>
          <p className="text-xs text-muted-foreground">Current user: {user?.email || 'Not logged in'}</p>
        </CardContent>
        <CardFooter>
          <Link href="/" className="w-full">
            <Button className="w-full">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );

  const showGlobalCreate = ['repository', 'notices', 'exams', 'attendance', 'projects'].includes(activeTab);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <TechBackground />
      
      <header className="w-full px-4 md:px-12 pt-12 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 z-10">
        <div className="flex items-center gap-4 md:gap-6">
          <TechXeraLogo className="w-16 h-16 md:w-20 md:h-20 shadow-2xl shadow-primary/20" customUrl={dbSettings?.logoUrl} />
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-headline font-bold tracking-tighter">Admin Central</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
              <Shield size={12} className="text-primary" />
              <p className="text-primary font-bold text-[8px] md:text-[10px] uppercase tracking-widest truncate max-w-[150px] md:max-w-none">ROOT: {user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full h-12 md:h-14 px-4 md:px-8 rounded-2xl font-bold bg-white/50 backdrop-blur-md shadow-sm border-2">
              <Home className="mr-2" size={18} /> Portal Home
            </Button>
          </Link>
          {showGlobalCreate && (
            <Button 
              onClick={handleGlobalCreate}
              className="h-12 md:h-14 px-4 md:px-8 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 flex-1 md:flex-none"
            >
              <Plus className="mr-2" size={18} /> 
              <span className="hidden xs:inline">
                {activeTab === 'repository' ? 'New Material' : 
                 activeTab === 'notices' ? 'New Notice' : 
                 activeTab === 'exams' ? 'New Exam' : 'New Session'}
              </span>
              <span className="xs:hidden">Create</span>
            </Button>
          )}
          <Button onClick={handleLogout} variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-2xl font-bold text-destructive hover:bg-destructive/10">
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-12 pb-32 space-y-8 z-10 overflow-hidden">
        <Tabs defaultValue="results" className="w-full" onValueChange={setActiveTab}>
          <div className="bg-white/80 dark:bg-card/40 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 shadow-xl mb-8 md:mb-12 border border-white/20 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-transparent flex flex-nowrap justify-start lg:justify-center h-auto gap-1 md:gap-2 border-none min-w-max">
              {[
                { id: 'results', label: 'Results', icon: <GraduationCap size={16} /> },
                { id: 'students', label: 'Students', icon: <Users size={16} /> },
                { id: 'teachers', label: 'Teachers', icon: <Users size={16} /> },
                { id: 'support', label: 'Support Hub', icon: <LifeBuoy size={16} /> },
                { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 size={16} /> },
                { id: 'exams', label: 'Exams', icon: <CalendarIcon size={16} /> },
                { id: 'certificates', label: 'Certificates', icon: <Award size={16} /> },
                { id: 'challenges', label: 'Challenges', icon: <Zap size={16} /> },
                { id: 'projects', label: 'Projects', icon: <Code size={16} /> },
                { id: 'notices', label: 'Notices', icon: <Bell size={16} /> },
                { id: 'repository', label: 'Repository', icon: <BookOpen size={16} /> },
                { id: 'roadmaps', label: 'Roadmaps', icon: <Map size={16} /> },
                { id: 'messages', label: 'Send Message', icon: <MessageSquare size={16} /> },
                { id: 'landing', label: 'Landing Page', icon: <Layout size={16} /> },
                { id: 'branding', label: 'Branding', icon: <SettingsIcon size={16} /> },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white h-10 md:h-12 px-4 md:px-8 rounded-[1.2rem] md:rounded-[1.5rem] font-bold uppercase text-[9px] md:text-[10px] tracking-widest gap-2 transition-all hover:bg-primary/5 border-none whitespace-nowrap"
                >
                  {tab.icon} {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card className="glass border-none rounded-[2rem] md:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden min-h-[500px] md:min-h-[600px]">
            <CardContent className="p-6 md:p-12">
              
              <TabsContent value="results" className="mt-0 space-y-8 md:space-y-12">
                <div className="space-y-6 md:space-y-8">
                  <div className="max-w-md">
                    <Select onValueChange={setSelectedExamCycle}>
                      <SelectTrigger className="h-12 md:h-14 rounded-2xl bg-background/50 border-2 font-bold text-base md:text-lg shadow-sm">
                        <SelectValue placeholder="-- Select Exam Cycle --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {allExams?.map(exam => (
                          <SelectItem key={exam.id} value={exam.id} className="font-medium">{exam.title} - {exam.semester}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                    <Table className="min-w-[600px] md:min-w-full">
                      <TableHeader className="bg-muted/50 border-b">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Student</TableHead>
                          <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-center">Roll No</TableHead>
                          <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-right">Operations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExamCycle ? (
                          allStudents?.map(student => (
                            <TableRow key={student.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                              <TableCell className="px-6 md:px-10 py-4 md:py-6">
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs md:text-base">{student.firstName[0]}</div>
                                  <p className="font-bold text-sm md:text-base">{student.firstName} {student.lastName}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-black text-primary/60 text-[10px] md:text-xs">{student.studentId}</TableCell>
                              <TableCell className="px-6 md:px-10 text-right">
                                <StudentGradeAction 
                                  db={db}
                                  student={student} 
                                  examId={selectedExamCycle} 
                                  onEdit={handleUpdateGradeClick} 
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-60 md:h-80 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-40">
                                <ClipboardList size={48} />
                                <p className="text-muted-foreground italic font-medium text-sm">Select an exam cycle above to manage grades</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-0 space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-6 md:space-y-8">
                    <h3 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-3">
                      <Clock className="text-primary" /> Class Registries
                    </h3>
                    <div className="space-y-4 md:space-y-6">
                      {sessionsLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                      ) : sessions?.length === 0 ? (
                        <div className="text-center py-20 md:py-24 border-4 border-dashed rounded-[2rem] md:rounded-[3rem] bg-muted/20">
                          <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">No active sessions found.</p>
                        </div>
                      ) : sessions?.map((session) => (
                        <Card 
                          key={session.id} 
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`border-none cursor-pointer hover:shadow-xl transition-all ${selectedSessionId === session.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-background/50 hover:bg-background/80'} rounded-[1.5rem] md:rounded-[2.5rem] shadow-lg`}
                        >
                          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                            <div className="space-y-1 md:space-y-2">
                              <h4 className="font-bold text-lg md:text-2xl tracking-tight">{session.className}</h4>
                              <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-sm text-muted-foreground font-bold">
                                <span className="flex items-center gap-1.5 md:gap-2"><Clock size={14} className="text-primary" /> {session.startTime}</span>
                                <span className="flex items-center gap-1.5 md:gap-2"><CalendarIcon size={14} className="text-primary" /> {session.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSessionId(session.id)
                                  setIsScannerOpen(true)
                                }}
                                className="flex-1 md:flex-none h-10 md:h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-xs"
                              >
                                <Camera className="mr-2" size={16} /> Launch Scanner
                              </Button>
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSession(session.id)
                                }}
                                size="icon" 
                                variant="ghost" 
                                className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                    <Card className="bg-primary/5 border-none rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 min-h-[350px] md:min-h-[400px]">
                      <h4 className="text-lg md:text-xl font-headline font-bold mb-4 md:mb-6 flex items-center justify-between">
                        Presence Monitor
                        {selectedSessionId && <Badge className="bg-primary text-[10px]">{sessionAttendance?.length || 0} Present</Badge>}
                      </h4>
                      {selectedSessionId ? (
                        <div className="space-y-3 md:space-y-4 max-h-[350px] md:max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                          {sessionAttendance?.map(record => (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={record.id} 
                              className="flex items-center justify-between p-4 md:p-5 bg-white dark:bg-black/20 rounded-2xl border border-white/40 shadow-sm"
                            >
                              <div>
                                <p className="font-bold text-sm md:text-base">{record.studentName}</p>
                                <p className="text-[8px] md:text-[10px] text-primary font-black uppercase tracking-widest">{record.studentId}</p>
                              </div>
                              <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase">{format(new Date(record.timestamp), 'h:mm a')}</p>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-[250px] md:h-[300px] flex flex-col items-center justify-center text-center gap-4 md:gap-6 text-muted-foreground opacity-50">
                          <CheckCircle2 size={64} />
                          <p className="max-w-[180px] md:max-w-[200px] font-medium text-xs md:text-sm">Select a session to view live presence logs.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-0 space-y-8">
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-6 animate-in fade-in zoom-in duration-300">
                  <div className="p-8 bg-primary/10 text-primary rounded-[3rem] border-4 border-primary/20 shadow-xl shadow-primary/20">
                    <CalendarIcon size={64} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold tracking-tight">Advanced Attendance Manager</h3>
                    <p className="text-muted-foreground font-medium max-w-[400px]">Access the dedicated interface for live QR scanning, session management, and the Global Student Attendance Summary.</p>
                  </div>
                  <Link href="/admin/attendance" className="mt-4">
                    <Button className="h-14 px-10 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                      Launch Portal <ArrowRight className="ml-2" size={20} />
                    </Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="students" className="mt-0 space-y-8">
                <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                  <Table className="min-w-[700px] md:min-w-full">
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Student</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Roll No</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-center">Verification</TableHead>
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-right">Operations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStudents?.map(student => (
                        <TableRow key={student.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                          <TableCell className="px-6 md:px-10 py-4 md:py-6">
                            <p className="font-bold text-foreground text-sm md:text-base">{student.firstName} {student.lastName}</p>
                          </TableCell>
                          <TableCell className="py-4 md:py-6">
                            <p className="text-muted-foreground font-medium uppercase text-[10px] md:text-xs">{student.studentId}</p>
                          </TableCell>
                          <TableCell className="py-4 md:py-6 text-center">
                            <Badge className="bg-primary hover:bg-primary/90 text-white rounded-full px-3 md:px-4 py-0.5 md:py-1 lowercase font-bold text-[9px] md:text-[10px]">
                              {student.status || (student.isApproved ? 'approved' : 'pending')}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 md:px-10 text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              {!student.isApproved ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-green-500 hover:bg-green-50 rounded-xl" onClick={() => handleApproveStudent(student.id)}><CheckCircle size={18} /></Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-orange-500 hover:bg-orange-50 rounded-xl" onClick={() => handleRejectStudent(student.id)}><XCircle size={18} /></Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => handleDeleteStudent(student.id)}><Trash2 size={18} /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="teachers" className="mt-0 space-y-8">
                <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                  <Table className="min-w-[700px] md:min-w-full">
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Teacher</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Employee ID</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-center">Status</TableHead>
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-right">Operations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTeachers?.map(teacher => (
                        <TableRow key={teacher.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                          <TableCell className="px-6 md:px-10 py-4 md:py-6">
                            <p className="font-bold text-foreground text-sm md:text-base">{teacher.firstName} {teacher.lastName}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Role: {teacher.role || 'teacher'}</p>
                          </TableCell>
                          <TableCell className="py-4 md:py-6">
                            <p className="text-muted-foreground font-medium uppercase text-[10px] md:text-xs">{teacher.employeeId}</p>
                          </TableCell>
                          <TableCell className="py-4 md:py-6 text-center">
                            <Badge className={`${teacher.isApproved ? 'bg-primary' : 'bg-muted-foreground'} text-white rounded-full px-3 py-0.5 lowercase font-bold text-[9px]`}>
                              {teacher.status || (teacher.isApproved ? 'approved' : 'pending')}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 md:px-10 text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              {!teacher.isApproved ? (
                                <>
                                  <Button variant="ghost" size="sm" className="h-8 md:h-10 text-xs font-bold text-green-500 hover:bg-green-50 rounded-xl" onClick={() => handleApproveTeacher(teacher.id, 'teacher')}>Approve</Button>
                                  <Button variant="ghost" size="sm" className="h-8 md:h-10 text-xs font-bold text-blue-500 hover:bg-blue-50 rounded-xl" onClick={() => handleApproveTeacher(teacher.id, 'admin')}>Make Admin</Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:bg-orange-50 rounded-xl" onClick={() => handleRejectTeacher(teacher.id)}><XCircle size={18} /></Button>
                                </>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:bg-orange-50 rounded-xl" onClick={() => handleRejectTeacher(teacher.id)}><XCircle size={18} /></Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => handleDeleteTeacher(teacher.id)}><Trash2 size={18} /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="support" className="mt-0 space-y-6 md:space-y-8">
                <h3 className="text-xl md:text-2xl font-headline font-bold">Inquiry Management</h3>
                <div className="grid gap-4">
                  {supportInquiries?.map(inquiry => (
                    <Card key={inquiry.id} className="bg-background/50 rounded-xl md:rounded-2xl border-none p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4 md:gap-6 border border-white/10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={cn(inquiry.status === 'pending' ? 'bg-orange-500' : 'bg-green-500')}>{inquiry.status}</Badge>
                          <h4 className="font-bold text-base md:text-lg truncate max-w-[200px] md:max-w-none">{inquiry.subject}</h4>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{inquiry.message}</p>
                        <p className="text-[8px] md:text-[10px] font-black text-primary/50 uppercase tracking-widest">FROM: {inquiry.name} ({inquiry.email})</p>
                      </div>
                      {inquiry.status === 'pending' && (
                        <Button variant="outline" size="sm" className="h-9 md:h-10 rounded-xl text-xs" onClick={() => handleResolveInquiry(inquiry.id)}>Mark Resolved</Button>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="exams" className="mt-0 space-y-6 md:space-y-8">
                <h3 className="text-xl md:text-2xl font-headline font-bold">Academic Calendar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {allExams?.map(exam => (
                    <Card key={exam.id} className="p-4 md:p-6 bg-background/50 rounded-xl md:rounded-2xl border border-white/10 space-y-3 md:space-y-4">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-lg md:text-xl truncate">{exam.title}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase">{exam.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] md:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><CalendarIcon size={14} /> {exam.examDate}</span>
                        <span className="flex items-center gap-1.5"><Layout size={14} /> {exam.semester}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="challenges" className="mt-0 space-y-6 md:space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-headline font-bold">Challenge Management</h3>
                  <Dialog open={isChallengeDialogOpen} onOpenChange={(open) => { setIsChallengeDialogOpen(open); if (!open) setEditingChallenge(null); }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90" onClick={() => { setEditingChallenge(null); setChallengeForm({ title: '', description: '', difficulty: 'medium', category: 'Programming', timeLimit: 10, questions: [{ id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]}); }}>
                        <Plus size={18} /> Create Challenge
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingChallenge ? 'Update Challenge' : 'Create New Challenge'}</DialogTitle>
                        <DialogDescription>{editingChallenge ? 'Modify the details of the challenge' : 'Add a new programming or logic challenge for students'}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSaveChallenge} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold">Challenge Title</Label>
                            <Input
                              placeholder="e.g., Array Sorting"
                              value={challengeForm.title}
                              onChange={(e) => setChallengeForm({...challengeForm, title: e.target.value})}
                              required
                              className="rounded-lg border-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold">Category</Label>
                            <Input
                              placeholder="e.g., Programming"
                              value={challengeForm.category}
                              onChange={(e) => setChallengeForm({...challengeForm, category: e.target.value})}
                              required
                              className="rounded-lg border-2"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-bold">Description</Label>
                          <Textarea
                            placeholder="Challenge description..."
                            value={challengeForm.description}
                            onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                            required
                            className="rounded-lg border-2 min-h-[80px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-bold">Difficulty Level</Label>
                            <Select value={challengeForm.difficulty} onValueChange={(val) => setChallengeForm({...challengeForm, difficulty: val as any})}>
                              <SelectTrigger className="rounded-lg border-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="font-bold flex items-center gap-2">Time Limit (Minutes)</Label>
                            <Input
                              type="number"
                              placeholder="e.g. 10"
                              min="1"
                              value={challengeForm.timeLimit}
                              onChange={(e) => setChallengeForm({...challengeForm, timeLimit: parseInt(e.target.value) || 10})}
                              required
                              className="rounded-lg border-2"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                          <div className="flex justify-between items-center">
                            <Label className="font-bold">Questions</Label>
                            <Button
                              type="button"
                              onClick={addQuestionToChallengeForm}
                              variant="outline"
                              className="gap-2"
                            >
                              <Plus size={16} /> Add Question
                            </Button>
                          </div>

                          {challengeForm.questions.map((q, idx) => (
                            <Card key={idx} className="p-4 space-y-3 bg-background/50 border-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold">Question {idx + 1}</h4>
                                {challengeForm.questions.length > 1 && (
                                  <Button
                                    type="button"
                                    onClick={() => removeQuestionFromChallengeForm(idx)}
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm">Question Text</Label>
                                <Input
                                  placeholder="Enter the question"
                                  value={q.question}
                                  onChange={(e) => updateQuestionInChallengeForm(idx, 'question', e.target.value)}
                                  required
                                  className="rounded-lg"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm">Points</Label>
                                <Input
                                  type="number"
                                  placeholder="Points for this question"
                                  value={q.points}
                                  onChange={(e) => updateQuestionInChallengeForm(idx, 'points', parseInt(e.target.value))}
                                  required
                                  className="rounded-lg"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm mb-3">Answer Options</Label>
                                <div className="space-y-2">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${idx}`}
                                        checked={q.correctAnswer === optIdx}
                                        onChange={() => updateQuestionInChallengeForm(idx, 'correctAnswer', optIdx)}
                                        className="w-4 h-4"
                                      />
                                      <Input
                                        placeholder={`Option ${optIdx + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                          const newOptions = [...q.options]
                                          newOptions[optIdx] = e.target.value
                                          updateQuestionInChallengeForm(idx, 'options', newOptions)
                                        }}
                                        required
                                        className="rounded-lg flex-1"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsChallengeDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-primary">
                            {editingChallenge ? 'Update Challenge' : 'Create Challenge'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {allChallenges && allChallenges.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {allChallenges.map(challenge => (
                      <Card key={challenge.id} className="p-4 md:p-6 bg-background/50 rounded-xl md:rounded-2xl border border-white/10 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg md:text-xl truncate">{challenge.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{challenge.description}</p>
                          </div>
                          <Badge className={`text-[9px] uppercase ${
                            challenge.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            challenge.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {challenge.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] md:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><FileText size={14} /> {challenge.questions?.length || 0} Q</span>
                          <span className="flex items-center gap-1.5"><Zap size={14} className="text-yellow-500" /> {challenge.totalPoints || 0} pts</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => handleEditChallenge(challenge)} className="flex-1 text-primary hover:bg-primary/10">
                            <Edit size={16} className="mr-2" /> Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            variant="ghost"
                            className="flex-1 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={16} className="mr-2" /> Remove
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center border-2 border-dashed">
                    <Zap size={48} className="mx-auto opacity-20 mb-4" />
                    <p className="text-muted-foreground font-medium">No challenges yet. Create one to get started!</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="certificates" className="mt-0 space-y-6 md:space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-headline font-bold">Award Certificates</h3>
                  <Dialog open={isCertDialogOpen} onOpenChange={setIsCertDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90">
                        <Plus size={18} /> Issue Certificate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Issue Certificate</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCertificate} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Certificate Title</Label>
                          <Input required placeholder="e.g. React Mastery" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Student</Label>
                          <Select required value={certForm.studentId} onValueChange={val => setCertForm({...certForm, studentId: val})}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {allStudents?.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>File URL</Label>
                          <Input required placeholder="https://..." value={certForm.fileUrl} onChange={e => setCertForm({...certForm, fileUrl: e.target.value})} className="rounded-xl" />
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full rounded-xl">Assign Certificate</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCertificates?.map(cert => {
                    const student = allStudents?.find(s => s.id === cert.studentId)
                    return (
                    <Card key={cert.id} className="p-6 bg-background/50 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{cert.title}</h4>
                          <p className="text-sm text-muted-foreground">Issued to: {student ? `${student.firstName} ${student.lastName}` : 'Unknown'}</p>
                        </div>
                        <Award className="text-primary shrink-0" />
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{format(new Date(cert.issueDate), 'PPP')}</span>
                        <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">View File</a>
                      </div>
                      <Button variant="ghost" onClick={() => handleDeleteCertificate(cert.id)} className="w-full text-destructive hover:bg-destructive/10 mt-2">
                        <Trash2 size={16} className="mr-2" /> Revoke
                      </Button>
                    </Card>
                  )})}
                  {!allCertificates?.length && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                      No certificates issued yet.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notices" className="mt-0 space-y-6 md:space-y-8">
                <h3 className="text-xl md:text-2xl font-headline font-bold">Official Bulletins</h3>
                <div className="grid gap-4">
                  {allNotices?.map(notice => (
                    <Card key={notice.id} className="bg-background/50 rounded-xl md:rounded-2xl border-none p-4 md:p-6 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-base md:text-lg truncate max-w-[200px] md:max-w-none">{notice.title}</h4>
                          <Badge variant={notice.isUrgent ? 'destructive' : 'default'} className="text-[8px] md:text-[10px] uppercase">{notice.isUrgent ? 'URGENT' : 'NORMAL'}</Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{notice.description}</p>
                        <p className="text-[8px] md:text-[10px] font-black uppercase text-primary/40 mt-3 md:mt-4">{format(new Date(notice.publishDate), 'PPP')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleEditNotice(notice)}><Edit size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => handleDeleteNotice(notice.id)}><Trash2 size={16} /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="repository" className="mt-0 space-y-8">
                <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                  <Table className="min-w-[600px] md:min-w-full">
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Title</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Subject</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Type/Section</TableHead>
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-right">Operations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMaterials?.map(material => (
                        <TableRow key={material.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                          <TableCell className="px-6 md:px-10 py-4 md:py-6"><p className="font-bold text-foreground text-sm md:text-base truncate max-w-[150px] md:max-w-none">{material.title}</p></TableCell>
                          <TableCell className="py-4 md:py-6"><p className="text-muted-foreground uppercase font-medium text-[10px] md:text-xs">{material.subject}</p></TableCell>
                          <TableCell className="py-4 md:py-6"><Badge variant="outline" className="rounded-full text-[9px] md:text-xs px-2 md:px-4">{material.materialType || 'Notes'}</Badge></TableCell>
                          <TableCell className="px-6 md:px-10 text-right">
                            <div className="flex justify-end gap-1 md:gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleEditMaterial(material)}><Edit size={18} /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => handleDeleteMaterial(material.id)}><Trash2 size={18} /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="mt-0 space-y-6 md:space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-headline font-bold">Projects Repository</h3>
                  <Dialog open={isProjectDialogOpen} onOpenChange={(open) => { setIsProjectDialogOpen(open); if (!open) setEditingProject(null); }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90" onClick={() => { setEditingProject(null); setProjectForm({ title: '', description: '', techStack: '', fileUrl: '', thumbnailUrl: '' }); }}>
                        <Plus size={18} /> Add Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>{editingProject ? 'Update Project' : 'New Project'}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSaveProject} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input required placeholder="E-commerce App" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea required placeholder="Describe the project..." value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Tech Stack</Label>
                          <Input required placeholder="React, Node.js, Firebase..." value={projectForm.techStack} onChange={e => setProjectForm({...projectForm, techStack: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Download / Repo URL</Label>
                          <Input required type="url" placeholder="https://github.com/..." value={projectForm.fileUrl} onChange={e => setProjectForm({...projectForm, fileUrl: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Thumbnail URL (Optional)</Label>
                          <Input type="url" placeholder="https://..." value={projectForm.thumbnailUrl} onChange={e => setProjectForm({...projectForm, thumbnailUrl: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="pt-4">
                          <Button type="submit" className="w-full rounded-xl">{editingProject ? 'Update Project' : 'Publish Project'}</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allProjects?.map(project => (
                    <Card key={project.id} className="p-6 bg-background/50 rounded-2xl space-y-4 overflow-hidden relative">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-4">
                          <h4 className="font-bold text-lg leading-tight mb-1">{project.title}</h4>
                          <Badge variant="secondary" className="text-[9px] mb-2">{project.techStack}</Badge>
                          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t border-border/10">
                        <a href={project.fileUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">View Source</a>
                        <span>{format(new Date(project.createdAt), 'MMM yyyy')}</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="ghost" onClick={() => handleEditProject(project)} className="flex-1 text-primary hover:bg-primary/10 rounded-xl">
                          <Edit size={16} className="mr-2" /> Edit
                        </Button>
                        <Button variant="ghost" onClick={() => handleDeleteProject(project.id)} className="flex-1 text-destructive hover:bg-destructive/10 rounded-xl">
                          <Trash2 size={16} className="mr-2" /> Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {!allProjects?.length && (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                      <Layout size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-medium">No projects added yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="landing" className="mt-0">
                <form onSubmit={handleUpdateLandingPage} className="max-w-4xl space-y-10">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-3xl border border-primary/10">
                      <div className="space-y-1">
                        <Label className="text-lg font-bold">Team & Trust Section</Label>
                        <p className="text-sm text-muted-foreground">Enable the team showcase and happiness score module.</p>
                      </div>
                      <Switch 
                        checked={landingPageForm.trustSectionEnabled} 
                        onCheckedChange={val => setLandingPageForm({...landingPageForm, trustSectionEnabled: val})} 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ImageIcon size={14} /> Team Image URL</Label>
                        <Input 
                          value={landingPageForm.trustTeamImageUrl} 
                          onChange={e => setLandingPageForm({...landingPageForm, trustTeamImageUrl: e.target.value})}
                          placeholder="https://..."
                          className="h-12 rounded-2xl bg-background/50" 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Heart size={14} /> Happiness Score (%)</Label>
                        <Input 
                          type="number"
                          max="100"
                          min="0"
                          value={landingPageForm.trustScore} 
                          onChange={e => setLandingPageForm({...landingPageForm, trustScore: parseInt(e.target.value)})}
                          className="h-12 rounded-2xl bg-background/50" 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ratings Subtext</Label>
                      <Input 
                        value={landingPageForm.trustRatingsCount} 
                        onChange={e => setLandingPageForm({...landingPageForm, trustRatingsCount: e.target.value})}
                        placeholder="e.g. based on 1,548 ratings..."
                        className="h-12 rounded-2xl bg-background/50" 
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Section Description</Label>
                      <Textarea 
                        value={landingPageForm.trustDescription} 
                        onChange={e => setLandingPageForm({...landingPageForm, trustDescription: e.target.value})}
                        className="min-h-[120px] rounded-3xl bg-background/50 p-6" 
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Partner Logo URLs (Comma Separated)</Label>
                      <Textarea 
                        value={landingPageForm.trustPartnerLogos} 
                        onChange={e => setLandingPageForm({...landingPageForm, trustPartnerLogos: e.target.value})}
                        placeholder="URL1, URL2, URL3..."
                        className="min-h-[100px] rounded-3xl bg-background/50 p-6 text-xs" 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full md:w-auto h-14 px-12 bg-primary text-white hover:bg-primary/90 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
                    Update Landing Page <Send className="ml-3" size={18} />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="roadmaps" className="mt-0 space-y-8 md:space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-3">
                    <Map className="text-primary" /> Curate Roadmaps
                  </h3>
                  <Button onClick={() => setIsRoadmapDialogOpen(true)} className="bg-primary text-white hover:bg-primary/90 rounded-xl shadow-lg h-12 px-6 font-bold w-full md:w-auto">
                    <Plus className="mr-2" size={18} /> Add Roadmap
                  </Button>
                </div>

                <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner p-6">
                  {allRoadmaps?.length === 0 ? (
                    <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl">
                      <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No active roadmaps found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allRoadmaps?.map(roadmap => (
                        <Card key={roadmap.id} className="border-none bg-background shadow-md rounded-3xl overflow-hidden hover:shadow-xl transition-all h-full flex flex-col">
                          {roadmap.thumbnailUrl && (
                            <div className="h-32 bg-primary/5 w-full overflow-hidden shrink-0">
                              <img src={roadmap.thumbnailUrl} alt={roadmap.title} className="w-full h-full object-cover opacity-80" />
                            </div>
                          )}
                          <CardContent className="p-6 flex-1 flex flex-col">
                            <Badge variant="secondary" className="mb-3 uppercase text-[9px] font-black w-fit">{roadmap.field}</Badge>
                            <h4 className="font-bold text-lg mb-2 leading-tight">{roadmap.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-6 flex-1">{roadmap.description}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-border/40 mt-auto">
                              <a href={roadmap.fileUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1"><FileText size={14}/> View File</a>
                              <Button variant="ghost" onClick={() => handleDeleteRoadmap(roadmap.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-full">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {isRoadmapDialogOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm px-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl glass rounded-[2rem] md:rounded-[3rem] relative">
                      <Button variant="ghost" className="absolute right-4 md:right-6 top-4 md:top-6 rounded-full w-10 h-10 p-0 text-muted-foreground hover:bg-muted" onClick={() => setIsRoadmapDialogOpen(false)}>
                        <X size={20} />
                      </Button>
                      <CardHeader className="text-center pb-2 md:pb-4 pt-8 md:pt-10">
                        <CardTitle className="text-2xl md:text-3xl font-headline font-bold">New Roadmap</CardTitle>
                      </CardHeader>
                      <form onSubmit={handleCreateRoadmap}>
                        <CardContent className="space-y-4 md:space-y-6 px-6 md:px-10 pb-8 md:pb-10">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Roadmap Title</Label>
                            <Input required value={roadmapForm.title} onChange={e => setRoadmapForm({...roadmapForm, title: e.target.value})} placeholder="e.g. Computer Science Master Plan" className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-background/50" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Field / Stream</Label>
                            <Input required value={roadmapForm.field} onChange={e => setRoadmapForm({...roadmapForm, field: e.target.value})} placeholder="e.g. B.Tech CS" className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-background/50" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Description</Label>
                            <Textarea required value={roadmapForm.description} onChange={e => setRoadmapForm({...roadmapForm, description: e.target.value})} placeholder="Brief overview of the roadmap..." className="rounded-xl md:rounded-2xl min-h-[80px] md:min-h-[100px] bg-background/50" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">File URL</Label>
                              <Input required value={roadmapForm.fileUrl} onChange={e => setRoadmapForm({...roadmapForm, fileUrl: e.target.value})} placeholder="https://..." className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-background/50" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Thumbnail (Optional)</Label>
                              <Input value={roadmapForm.thumbnailUrl} onChange={e => setRoadmapForm({...roadmapForm, thumbnailUrl: e.target.value})} placeholder="https://..." className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-background/50" />
                            </div>
                          </div>
                          <Button type="submit" className="w-full h-12 md:h-14 mt-4 md:mt-8 bg-primary hover:bg-primary/90 rounded-xl md:rounded-2xl text-white font-bold text-sm md:text-base shadow-lg shadow-primary/20">
                            Publish Roadmap
                          </Button>
                        </CardContent>
                      </form>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="branding" className="mt-0">
                <form onSubmit={handleUpdateBranding} className="max-w-4xl space-y-10">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portal Name</Label>
                      <Input 
                        value={brandingForm.siteName} 
                        onChange={e => setBrandingForm({...brandingForm, siteName: e.target.value})}
                        placeholder="e.g. TechXera"
                        className="h-14 rounded-2xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary text-lg font-bold px-6" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ImageIcon size={14} /> Logo URL</Label>
                        <Input 
                          value={brandingForm.logoUrl} 
                          onChange={e => setBrandingForm({...brandingForm, logoUrl: e.target.value})}
                          placeholder="https://..."
                          className="h-14 rounded-2xl bg-background/50" 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Globe size={14} /> Favicon URL</Label>
                        <Input 
                          value={brandingForm.faviconUrl} 
                          onChange={e => setBrandingForm({...brandingForm, faviconUrl: e.target.value})}
                          placeholder="https://..."
                          className="h-14 rounded-2xl bg-background/50" 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hero Description</Label>
                      <Textarea 
                        value={brandingForm.heroDescription} 
                        onChange={e => setBrandingForm({...brandingForm, heroDescription: e.target.value})}
                        className="min-h-[180px] rounded-3xl bg-background/50 p-6 text-sm leading-relaxed" 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full md:w-auto h-14 px-12 bg-primary text-white hover:bg-primary/90 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
                    Update Branding <Send className="ml-3" size={18} />
                  </Button>
                </form>
                </TabsContent>

              <TabsContent value="messages" className="mt-0 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                    <MessageSquare className="text-primary" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-headline font-bold tracking-tight">Send Message</h2>
                    <p className="text-muted-foreground text-sm font-medium">Select students and send a message via Email or WhatsApp</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Student Selector */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Recipients {selectedRecipients.length > 0 && <span className="text-primary">({selectedRecipients.length} selected)</span>}
                      </Label>
                      <Button variant="ghost" size="sm" onClick={handleSelectAllMsg}
                        className="text-xs font-bold text-primary h-8 px-3 rounded-xl hover:bg-primary/10">
                        {filteredMsgStudents.length > 0 && filteredMsgStudents.every((s: any) => selectedRecipients.includes(s.id)) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                      <Input placeholder="Search by name or email..." value={msgSearchQuery}
                        onChange={e => setMsgSearchQuery(e.target.value)}
                        className="h-12 pl-11 rounded-2xl bg-background/50" />
                    </div>

                    <div className="border border-border/30 rounded-[1.5rem] overflow-hidden bg-background/20 max-h-[380px] overflow-y-auto scrollbar-hide">
                      {filteredMsgStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50 gap-3">
                          <Users size={32} /><p className="text-sm">No students found</p>
                        </div>
                      ) : filteredMsgStudents.map((student: any) => (
                        <div key={student.id} onClick={() => handleToggleRecipient(student.id)}
                          className={cn(
                            "flex items-center gap-4 p-4 cursor-pointer border-b border-border/10 hover:bg-primary/5 transition-colors select-none",
                            selectedRecipients.includes(student.id) && "bg-primary/10 hover:bg-primary/15"
                          )}>
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            selectedRecipients.includes(student.id) ? "bg-primary border-primary" : "border-muted-foreground/40"
                          )}>
                            {selectedRecipients.includes(student.id) && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.email || 'No email on record'}</p>
                          </div>
                          {selectedRecipients.includes(student.id) && (
                            <Badge className="bg-primary/20 text-primary text-[9px] border-none shrink-0">Selected</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Compose */}
                  <div className="space-y-5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compose Message</Label>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Subject (optional)</Label>
                      <Input placeholder="e.g. Important Exam Notice"
                        value={msgSubject} onChange={e => setMsgSubject(e.target.value)}
                        className="h-12 rounded-2xl bg-background/50" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Message Body *</Label>
                      <Textarea placeholder="Write your message here..."
                        value={msgBody} onChange={e => setMsgBody(e.target.value)}
                        className="min-h-[200px] rounded-2xl bg-background/50 resize-none text-sm leading-relaxed" />
                    </div>

                    {selectedRecipients.length > 0 && (
                      <div className="p-3 bg-primary/10 rounded-2xl flex items-center gap-2 text-xs text-primary font-semibold">
                        <Users size={14} />
                        {selectedRecipients.length} recipient{selectedRecipients.length > 1 ? 's' : ''} selected
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <Button onClick={handleSendViaEmail}
                        disabled={isSendingMsg || selectedRecipients.length === 0 || !msgBody.trim()}
                        className="h-14 rounded-2xl font-bold text-sm bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                        {isSendingMsg ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                        Send via Email
                      </Button>
                      <Button onClick={handleSendViaWhatsApp}
                        disabled={selectedRecipients.length === 0 || !msgBody.trim()}
                        variant="outline"
                        className="h-14 rounded-2xl font-bold text-sm border-2 border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10 flex items-center justify-center gap-3">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Send via WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Sent Messages History ── */}
              <TabsContent value="messages" className="mt-0">
                <div className="mt-12 space-y-6">
                  <div className="flex items-center gap-3 border-t border-border/20 pt-8">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <FileText className="text-primary" size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-headline font-bold">Sent Messages History</h3>
                      <p className="text-xs text-muted-foreground">All messages dispatched from admin panel</p>
                    </div>
                    <Badge className="ml-auto bg-primary/10 text-primary border-none font-bold">
                      {allMessages?.length || 0} Total
                    </Badge>
                  </div>

                  {(!allMessages || allMessages.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-48 opacity-40 gap-4">
                      <MessageSquare size={40} />
                      <p className="text-sm text-muted-foreground font-medium">No messages sent yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allMessages.map((msg: any) => {
                        const isExpanded = expandedMsgId === msg.id
                        const recipientEmails: string[] = Array.isArray(msg.recipientEmails)
                          ? msg.recipientEmails
                          : (msg.recipientEmails ? msg.recipientEmails.split(',') : [])
                        // Try to match student names from allStudents
                        const recipientNames = (msg.recipientIds || []).map((rid: string) => {
                          const s = (allStudents || []).find((st: any) => st.id === rid)
                          return s ? `${s.firstName} ${s.lastName}` : null
                        }).filter(Boolean)

                        return (
                          <div key={msg.id} className="rounded-2xl border border-border/20 overflow-hidden bg-background/30">
                            {/* Clickable header row */}
                            <div
                              onClick={() => setExpandedMsgId(isExpanded ? null : msg.id)}
                              className="flex items-center gap-3 p-4 md:p-5 cursor-pointer hover:bg-primary/5 transition-colors select-none"
                            >
                              {/* Channel icon */}
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                msg.channel === 'email' ? 'bg-blue-500/10' : 'bg-green-500/10'
                              )}>
                                {msg.channel === 'email'
                                  ? <Mail size={18} className="text-blue-500" />
                                  : <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                }
                              </div>

                              {/* Summary */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-sm truncate">{msg.subject || '(No subject)'}</p>
                                  <Badge className={cn(
                                    "text-[9px] font-bold border-none shrink-0",
                                    msg.channel === 'email' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-600'
                                  )}>
                                    {msg.channel === 'email' ? '📧 Email' : '💬 WhatsApp'}
                                  </Badge>
                                  {msg.status === 'sent' && (
                                    <Badge className="text-[9px] bg-emerald-500/10 text-emerald-600 border-none shrink-0">✓ Sent</Badge>
                                  )}
                                </div>
                                {/* Recipients line */}
                                <p className="text-[11px] text-primary/80 font-semibold mt-0.5 truncate">
                                  To: {recipientNames.length > 0
                                    ? recipientNames.slice(0, 3).join(', ') + (recipientNames.length > 3 ? ` +${recipientNames.length - 3} more` : '')
                                    : recipientEmails.length > 0
                                      ? recipientEmails.slice(0, 2).join(', ') + (recipientEmails.length > 2 ? ` +${recipientEmails.length - 2} more` : '')
                                      : `${msg.recipientIds?.length || 0} student(s)`
                                  }
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] text-muted-foreground">
                                    <Clock size={10} className="inline mr-1" />
                                    {msg.sentAt ? format(new Date(msg.sentAt), 'dd MMM yyyy, hh:mm a') : '—'}
                                  </span>
                                </div>
                              </div>

                              {/* Expand arrow + delete */}
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    if (!db || !confirm('Delete this message record?')) return
                                    await deleteDoc(doc(db, 'messages', msg.id))
                                    toast({ title: 'Record Deleted' })
                                  }}
                                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 size={14} />
                                </Button>
                                <div className={cn(
                                  "h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground transition-transform",
                                  isExpanded && "rotate-180"
                                )}>
                                  <ArrowRight size={14} className="rotate-90" />
                                </div>
                              </div>
                            </div>

                            {/* Expanded: full message + all recipients */}
                            {isExpanded && (
                              <div className="border-t border-border/20 bg-muted/10 p-4 md:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Recipients */}
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recipients</p>
                                  <div className="flex flex-wrap gap-2">
                                    {recipientNames.length > 0
                                      ? recipientNames.map((name: string, i: number) => (
                                          <div key={i} className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">
                                              {name[0]}
                                            </div>
                                            <span className="text-xs font-semibold">{name}</span>
                                            {recipientEmails[i] && (
                                              <span className="text-[10px] text-muted-foreground">({recipientEmails[i]})</span>
                                            )}
                                          </div>
                                        ))
                                      : recipientEmails.map((email: string, i: number) => (
                                          <div key={i} className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                                            <Mail size={11} className="text-primary" />
                                            <span className="text-xs font-semibold">{email}</span>
                                          </div>
                                        ))
                                    }
                                  </div>
                                </div>
                                {/* Full message */}
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message</p>
                                  <div className="bg-background/60 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap border border-border/20">
                                    {msg.body}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

            </CardContent>
          </Card>
        </Tabs>
      </main>

      <Dialog open={isScannerOpen} onOpenChange={(open) => { setIsScannerOpen(open); if (!open) setScannedStudent(null); }}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 overflow-hidden">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl md:text-2xl font-headline font-bold mb-1 truncate">{scannedStudent ? 'Verify Student Details' : `Scanner: ${activeSession?.className}`}</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium text-center text-xs md:text-sm">{scannedStudent ? 'Review credentials before logging attendance.' : 'Align student identity QR within the frame'}</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 md:gap-8 py-4">
            {!scannedStudent ? (
              <>
                <div className="relative w-full">
                  <div id="admin-attendance-scan-reader" className="w-full rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-4 border-primary/20 bg-muted/20 min-h-[250px] md:min-h-[300px]" />
                </div>
                <div className="p-4 md:p-5 bg-primary/5 rounded-xl md:rounded-2xl w-full flex items-center gap-3 text-[9px] md:text-xs text-primary border border-primary/20">
                  <ShieldCheck size={20} className="shrink-0" />
                  <p className="font-medium leading-relaxed">Secure Admin Hub. Instant verification enabled.</p>
                </div>
                <Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full h-10 md:h-12 rounded-xl font-bold text-xs">Terminate Scanner</Button>
              </>
            ) : (
              <div className="w-full space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Users size={48} /></div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-headline font-bold text-foreground">{scannedStudent.name}</h3>
                    <p className="text-muted-foreground font-bold text-xs">ROLL NO: {scannedStudent.studentId}</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  <Button onClick={handleConfirmAttendance} className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/90">Confirm Attendance</Button>
                  <Button onClick={() => setScannedStudent(null)} variant="ghost" className="w-full h-12 rounded-xl font-bold text-muted-foreground">Cancel & Rescan</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">Initialize Class</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2"><Label className="text-xs">Module Name</Label><Input required placeholder="e.g. Advanced AI" value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} className="h-12 rounded-xl text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Date</Label><Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="h-12 rounded-xl text-xs" /></div>
              <div className="space-y-2"><Label className="text-xs">Start Time</Label><Input type="time" required value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} className="h-12 rounded-xl text-xs" /></div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-bold text-base md:text-lg">Initialize Session</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">{editingMaterial ? 'Update Material' : 'New Study Material'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveMaterial} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2"><Label className="text-xs">Title</Label><Input required value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className="h-12 rounded-xl text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Subject</Label><Input required value={materialForm.subject} onChange={e => setMaterialForm({...materialForm, subject: e.target.value})} className="h-12 rounded-xl text-sm" /></div>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select value={materialForm.materialType} onValueChange={val => setMaterialForm({...materialForm, materialType: val})}>
                  <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Notes">Notes</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                    <SelectItem value="Syllabus">Syllabus</SelectItem>
                    <SelectItem value="Question Bank">Question Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-xs">File URL</Label><Input required value={materialForm.fileUrl} onChange={e => setMaterialForm({...materialForm, fileUrl: e.target.value})} className="h-12 rounded-xl text-xs" /></div>
            <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-bold text-base md:text-lg">{editingMaterial ? 'Update' : 'Publish'} Material</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">{editingNotice ? 'Update Notice' : 'Publish Notice'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveNotice} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2"><Label className="text-xs">Title</Label><Input required value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} className="h-12 rounded-xl text-sm" /></div>
            <div className="space-y-2"><Label className="text-xs">Content</Label><Textarea required value={noticeForm.description} onChange={e => setNoticeForm({...noticeForm, description: e.target.value})} className="min-h-[120px] rounded-xl text-sm" /></div>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl"><Label className="font-bold text-sm">Urgent Priority</Label><Switch checked={noticeForm.isUrgent} onCheckedChange={val => setNoticeForm({...noticeForm, isUrgent: val})} /></div>
            <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-bold">{editingNotice ? 'Update' : 'Publish'} Bulletin</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">Schedule Exam</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateExam} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2"><Label className="text-xs">Exam Title</Label><Input required value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="h-12 rounded-xl text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Semester</Label>
                <Select value={examForm.semester} onValueChange={val => setExamForm({...examForm, semester: val})}>
                  <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Semester 1">Semester 1</SelectItem>
                    <SelectItem value="Semester 2">Semester 2</SelectItem>
                    <SelectItem value="Semester 3">Semester 3</SelectItem>
                    <SelectItem value="Semester 4">Semester 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs">Date</Label><Input type="date" required value={examForm.examDate} onChange={e => setExamForm({...examForm, examDate: e.target.value})} className="h-12 rounded-xl text-xs" /></div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-bold">Create Schedule</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-headline font-bold">Enter Academic Score</DialogTitle>
            <DialogDescription className="text-[10px] md:text-sm">Record evaluation for {selectedStudentForGrade?.firstName} {selectedStudentForGrade?.lastName}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveGrade} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2"><Label className="text-xs">Subject / Paper</Label><Input required value={gradeForm.subject} onChange={e => setGradeForm({...gradeForm, subject: e.target.value})} className="h-12 rounded-xl text-sm" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Marks (%)</Label>
                <Input required type="number" max="100" min="0" value={gradeForm.marks} onChange={e => {
                  const val = e.target.value;
                  const marksVal = parseInt(val);
                  const grade = isNaN(marksVal) ? '' : calculateGrade(marksVal);
                  setGradeForm({...gradeForm, marks: val, grade: grade});
                }} className="h-12 rounded-xl text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Letter Grade</Label>
                <Select value={gradeForm.grade} onValueChange={val => setGradeForm({...gradeForm, grade: val})}>
                  <SelectTrigger className="h-12 rounded-xl text-sm"><SelectValue placeholder="Grade" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-xs">Teacher's Remark</Label><Textarea value={gradeForm.remark} onChange={e => setGradeForm({...gradeForm, remark: e.target.value})} className="h-24 rounded-xl text-sm resize-none" /></div>
            <DialogFooter><Button type="submit" className="w-full h-12 rounded-xl font-bold">Save Result</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
