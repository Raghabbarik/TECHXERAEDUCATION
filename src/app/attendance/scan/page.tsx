
"use client"

import React, { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Loader2, Camera, CheckCircle2, AlertCircle, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import TechBackground from '@/components/TechBackground'

export default function AttendanceScanPage() {
  const [mounted, setMounted] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: profile } = useDoc(studentRef)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle scanner lifecycle
  useEffect(() => {
    if (!mounted || !scanning || status !== 'idle' || isUserLoading) return;

    const startScanner = async () => {
      try {
        // Test permission first
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Release immediately
        setHasCameraPermission(true);

        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 15, 
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        )
        
        scanner.render(
          (decodedText) => handleScan(decodedText),
          (error) => {
            // Noise is expected during search
          }
        )
        
        scannerRef.current = scanner
      } catch (error) {
        console.error('Scanner start error:', error);
        setHasCameraPermission(false);
      }
    }

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => {
          console.warn('Scanner cleanup warning:', err);
        });
        scannerRef.current = null;
      }
    }
  }, [mounted, scanning, status, isUserLoading])

  const handleScan = async (data: string) => {
    if (status === 'processing' || !db || !user || !profile) return
    
    try {
      const parsed = JSON.parse(data)
      if (parsed.type !== 'techxera-attendance' || !parsed.sessionId || !parsed.token) {
        // Silently ignore if it's not our QR format
        return;
      }

      // Valid QR found, stop UI scanner immediately
      if (scannerRef.current) {
        await scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
      
      setStatus('processing')
      
      const recordId = `${user.uid}_${parsed.sessionId}`
      const attendanceRef = doc(db, 'attendance', recordId)
      
      const existing = await getDoc(attendanceRef)
      if (existing.exists()) {
        throw new Error("Attendance already recorded for this session.")
      }

      await setDoc(attendanceRef, {
        id: recordId,
        sessionId: parsed.sessionId,
        studentUid: user.uid,
        studentId: profile.studentId,
        studentName: `${profile.firstName} ${profile.lastName}`,
        timestamp: new Date().toISOString(),
        tokenUsed: parsed.token,
        status: 'present'
      })

      setStatus('success')
      toast({ title: "Attendance Marked", description: "Successfully verified presence." })

    } catch (err: any) {
      console.error('Scan handling error:', err);
      setErrorMessage(err.message || "Scanning failed.")
      setStatus('error')
    }
  }

  const resetScanner = () => {
    setStatus('idle')
    setScanning(true)
    setErrorMessage('')
  }

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>
  if (!user) return null

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-24">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <Card className="glass border-none rounded-[3rem] p-12 shadow-2xl">
                  <div className="mx-auto w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle2 size={64} />
                  </div>
                  <h2 className="text-4xl font-headline font-bold mb-4">Confirmed!</h2>
                  <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                    Your attendance for the session has been securely recorded.
                  </p>
                  <Button onClick={() => router.push('/dashboard')} className="w-full h-14 rounded-2xl font-bold bg-green-500 hover:bg-green-600">
                    Return to Dashboard
                  </Button>
                </Card>
              </motion.div>
            ) : status === 'error' ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <Card className="glass border-none rounded-[3rem] p-12 shadow-2xl">
                  <div className="mx-auto w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-8">
                    <AlertCircle size={64} />
                  </div>
                  <h2 className="text-3xl font-headline font-bold mb-4">Verification Failed</h2>
                  <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                    {errorMessage}
                  </p>
                  <div className="flex flex-col gap-4">
                    <Button onClick={resetScanner} className="h-14 rounded-2xl font-bold">
                      <RefreshCw className="mr-2" size={20} /> Try Again
                    </Button>
                    <Button onClick={() => router.push('/support')} variant="ghost" className="h-14 rounded-2xl font-bold">
                      Need Help?
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass border-none rounded-[3.5rem] overflow-hidden shadow-2xl">
                  <CardHeader className="p-10 pb-0 text-center">
                    <div className="flex justify-center mb-6">
                      <div className="p-5 bg-primary/10 text-primary rounded-[2rem]">
                        <Camera size={40} />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-headline font-bold">Smart Scan</CardTitle>
                    <CardDescription className="text-lg">Align the QR code within the frame</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    {hasCameraPermission === false && (
                      <Alert variant="destructive" className="mb-6 rounded-2xl border-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                          Please enable camera permissions in your browser settings to use this feature.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="relative">
                      <div id="qr-reader" className="overflow-hidden rounded-[2.5rem] border-4 border-primary/20 bg-black/5 min-h-[300px]" />
                      {status === 'processing' && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem]">
                          <Loader2 className="animate-spin text-primary" size={48} />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center gap-4 text-xs text-muted-foreground">
                      <ShieldCheck className="text-primary shrink-0" size={20} />
                      <p>Identity verified via secure session token. Ensure you are within classroom range.</p>
                    </div>

                    <Button onClick={() => router.back()} variant="ghost" className="w-full h-14 rounded-2xl font-bold">
                      <ArrowLeft className="mr-2" /> Cancel Scan
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
