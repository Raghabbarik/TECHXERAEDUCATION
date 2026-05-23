
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, Info, Megaphone, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import SplitText from '@/components/SplitText'
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack'
import { TechXeraLogo } from '@/components/Navbar'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function NoticesPage() {
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
      router.push('/login?redirect=/notices')
    }
    // Redirect to dashboard if not approved (and not an admin)
    if (mounted && !isUserLoading && !isProfileLoading && user && profile && !profile.isApproved && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, isProfileLoading, profile, router, mounted, isAdmin])

  const noticesQuery = useMemoFirebase(() => query(collection(db, 'notices'), orderBy('publishDate', 'desc')), [db])
  const { data: notices, isLoading } = useCollection(noticesQuery)

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
      // Proceed even without profile
    } else {
      return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto w-full px-6 pt-32 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
        >
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">
              <SplitText 
                text="Notice Board"
                tag="span"
                duration={1.25}
                delay={50}
              />
            </h1>
            <p className="text-muted-foreground text-xl font-medium">Stay updated with the latest campus news.</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-6 py-3 bg-primary/10 text-primary rounded-2xl border border-primary/5 shadow-sm"
          >
            <Megaphone size={24} />
            <span className="font-bold text-lg">{notices?.length || 0} Announcements</span>
          </motion.div>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading updates...</p>
          </div>
        ) : notices && notices.length > 0 ? (
          <div className="h-[80vh] w-full rounded-[3rem] overflow-hidden border border-border/40 bg-white/30 backdrop-blur-sm shadow-inner relative">
            <ScrollStack useWindowScroll={false} blurAmount={2} className="bg-transparent">
              {notices.map((notice) => (
                <ScrollStackItem 
                  key={notice.id} 
                  itemClassName={`border-l-8 ${notice.isUrgent ? 'border-l-destructive' : 'border-l-primary'} bg-white !h-64`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[10px] py-1 px-4 uppercase tracking-widest font-black ${notice.isUrgent ? 'bg-destructive text-white' : 'bg-primary text-white'}`}>
                          {notice.isUrgent ? 'Urgent' : 'Official'}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={14} /> {notice.publishDate ? format(new Date(notice.publishDate), 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 flex-1 overflow-hidden">
                      <div className={`hidden sm:flex shrink-0 w-12 h-12 rounded-[1rem] items-center justify-center ${notice.isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {notice.isUrgent ? <AlertCircle size={24} /> : <Info size={24} />}
                      </div>
                      <div className="space-y-2 flex-1 overflow-hidden">
                        <h3 className="text-2xl md:text-3xl font-headline font-bold tracking-tight line-clamp-1">{notice.title}</h3>
                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base font-medium line-clamp-3">{notice.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border/40 text-[9px] font-black uppercase tracking-widest text-primary/40 text-right">
                      TechXera Communication Hub
                    </div>
                  </div>
                </ScrollStackItem>
              ))}
            </ScrollStack>
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-[3rem] bg-white/30 backdrop-blur-sm">
            <Megaphone size={64} className="mx-auto opacity-10 mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">No active notices at the moment.</p>
          </div>
        )}
      </main>
    </div>
  )
}
