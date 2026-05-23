
"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TechBackground from '@/components/TechBackground'
import Navbar, { TechXeraLogo } from '@/components/Navbar'
import { Lock, User, ArrowRight, Loader2, UserPlus, Calendar, CreditCard, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { safeErrorMessage, safeRedirect } from '@/lib/security'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [showPassword, setShowPassword] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Validate redirect URL — prevent open redirect attacks
  const rawRedirect = searchParams.get('redirect') || '/'
  const redirectTo = safeRedirect(rawRedirect, '/dashboard')

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email === AUTHORIZED_ADMIN_EMAIL) {
        router.push('/admin')
      } else {
        router.push(redirectTo)
      }
    }
  }, [user, isUserLoading, router, redirectTo])

  if (isUserLoading || user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Session...</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Admin Account Restricted",
        description: "Administrators must use the dedicated Admin Console.",
      })
      router.push('/admin/login')
      return;
    }
    if (isSignUp && password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Weak Password',
        description: 'Password must be at least 6 characters.',
      })
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user
        
        if (role === 'teacher') {
          await setDoc(doc(db, 'teachers', newUser.uid), {
            id: newUser.uid,
            employeeId: studentId.trim().toUpperCase(),
            firstName,
            lastName,
            email,
            dateOfBirth,
            enrollmentDate: new Date().toISOString(),
            isApproved: false,
            status: 'pending',
            role: 'teacher'
          })
        } else {
          await setDoc(doc(db, 'students', newUser.uid), {
            id: newUser.uid,
            studentId: studentId.trim().toUpperCase(),
            firstName,
            lastName,
            email,
            dateOfBirth,
            enrollmentDate: new Date().toISOString(),
            isApproved: false,
            status: 'pending',
            currentSemester: 'Semester 1'
          })
        }

        toast({
          title: "Account Created",
          description: "Your registration is pending administrator approval.",
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Login Successful",
          description: "Welcome back to the Student Portal.",
        })
      }
      router.push(redirectTo)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign Up Failed' : 'Login Failed',
        description: safeErrorMessage(error),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full max-w-md"
    >
      <Card className="glass shadow-2xl border-border/40 overflow-hidden">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-border/40">
          <motion.div 
            initial={{ rotate: -20 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto flex items-center justify-center mb-2"
          >
            <TechXeraLogo 
              className="w-20 h-20 shadow-xl shadow-primary/20" 
              customUrl={settings?.logoUrl}
            />
          </motion.div>
          <CardTitle className="text-3xl font-headline font-bold">
            {isSignUp ? (role === 'teacher' ? "Teacher Sign Up" : "Student Sign Up") : "Portal Login"}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Create your account (Subject to admin approval)" : "Enter your credentials to access your dashboard"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {isSignUp && (
              <>
                <div className="flex rounded-lg bg-muted/50 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${role === 'student' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${role === 'teacher' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Teacher
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Alex" 
                      required 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Smith" 
                      required 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">{role === 'teacher' ? 'Employee ID' : 'Student ID (Roll Number)'}</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      id="studentId" 
                      placeholder="TX-2025-001" 
                      className="pl-10 h-11 bg-background/50" 
                      required 
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      id="dob" 
                      type="date"
                      className="pl-10 h-11 bg-background/50" 
                      required 
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="alex@techxera.edu" 
                  className="pl-10 h-11 bg-background/50" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" 
                  className="pl-10 pr-11 h-11 bg-background/50" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button 
                type="submit"
                disabled={isLoading} 
                className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? (isSignUp ? "Creating..." : "Authenticating...") : (isSignUp ? "Sign Up" : "Login")} 
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </motion.div>
            
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium hover:underline block w-full"
              >
                {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <TechXeraLogo className="w-16 h-16 opacity-50" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 pt-24 pb-12">
        <Suspense fallback={<TechXeraLogo className="w-16 h-16 animate-pulse opacity-50" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  )
}
