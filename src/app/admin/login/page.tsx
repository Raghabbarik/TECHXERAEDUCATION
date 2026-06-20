
"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TechBackground from '@/components/TechBackground'
import { TechXeraLogo } from '@/components/Navbar'
import { Lock, User, ArrowRight, Loader2, Home, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { doc } from 'firebase/firestore'


function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  const teacherRef = useMemoFirebase(() => (db && user ? doc(db, 'teachers', user.uid) : null), [db, user])
  const { data: teacherProfile } = useDoc(teacherRef)

  useEffect(() => {
    if (!isUserLoading && user) {
      if (teacherProfile?.role === 'admin') {
        router.push('/admin')
      } else {
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "This portal is reserved for the primary administrator.",
        })
      }
    }
  }, [user, isUserLoading, teacherProfile, router, toast])

  if (isUserLoading || (user && teacherProfile?.role === 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Verifying Root Access...</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Admin Access Granted",
        description: "Redirecting to root console.",
      })
      router.push('/admin')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid credentials.",
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
        <CardHeader className="space-y-2 text-center pb-8 border-b border-border/40 bg-primary/5">
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
          <CardTitle className="text-3xl font-headline font-bold">Admin Console</CardTitle>
          <CardDescription>Management portal for the root campus administrator</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="email">Root Admin Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="admin@example.com" 
                  className="pl-10 h-12 bg-background/50" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Security Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12 bg-background/50" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button 
                type="submit"
                disabled={isLoading} 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? "Verifying..." : "Enter Portal"} 
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </motion.div>
            
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <div className="pt-2">
                Are you a student? <Link href="/login" className="text-primary font-medium hover:underline">Student Login</Link>
              </div>
              <div className="pt-2">
                <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
                  <Home size={14} className="mr-1" /> Back to Home
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}

export default function AdminLoginPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <TechXeraLogo className="w-16 h-16 opacity-50" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <main className="flex-1 flex items-center justify-center p-6 pt-24 pb-12">
        <Suspense fallback={<TechXeraLogo className="w-16 h-16 animate-pulse opacity-50" />}>
          <AdminLoginForm />
        </Suspense>
      </main>
    </div>
  )
}
