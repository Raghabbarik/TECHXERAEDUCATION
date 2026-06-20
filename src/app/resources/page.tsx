
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Download, FileText, Loader2, BookOpen, Map } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import SplitText from '@/components/SplitText'
import { TechXeraLogo } from '@/components/Navbar'
import { safeWindowOpen } from '@/lib/security'


export default function ResourcesPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'roadmaps' | 'materials'>('roadmaps')
  const [searchTerm, setSearchTerm] = useState('')
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const db = useFirestore()

  useEffect(() => { setMounted(true) }, [])

  const teacherRef = useMemoFirebase(() => (user && db ? doc(db, 'teachers', user.uid) : null), [user, db])
  const { data: teacherProfile } = useDoc(teacherRef)
  const isAdmin = teacherProfile?.role === 'admin'

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push('/login?redirect=/resources')
    if (mounted && !isUserLoading && !isProfileLoading && user && profile && !profile.isApproved && !isAdmin) router.push('/dashboard')
  }, [user, isUserLoading, isProfileLoading, profile, router, mounted, isAdmin])

  const resourcesQuery = useMemoFirebase(() => db ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db])
  const { data: resources, isLoading: isResourcesLoading } = useCollection(resourcesQuery)

  const roadmapsQuery = useMemoFirebase(() => db ? query(collection(db, 'roadmaps'), orderBy('createdAt', 'desc')) : null, [db])
  const { data: roadmaps, isLoading: isRoadmapsLoading } = useCollection(roadmapsQuery)

  const filtered = resources?.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.materialType.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <TechXeraLogo className="w-16 h-16 opacity-50" />
        </motion.div>
      </div>
    )
  }

  if (!user || (!profile?.isApproved && !isAdmin)) {
    if (isAdmin) { /* proceed */ } else { return null }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 md:p-10 pt-40 pb-32 space-y-8">

        {/* Header */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <BookOpen size={14} /> Repository
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter">
            <SplitText text="Campus Repository" tag="span" duration={0.6} delay={30} />
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
            Access the technical library for TechXera students. Explore a curated collection of lecture notes, research papers, and coding guides.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1.5 bg-muted/40 backdrop-blur-sm rounded-2xl w-fit border border-border/30">
          <button
            onClick={() => setActiveTab('roadmaps')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'roadmaps'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <Map size={15} />
            Choose Your Field
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === 'materials'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <FileText size={15} />
            Study Materials
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {/* ── Choose Your Field ── */}
          {activeTab === 'roadmaps' && (
            <motion.div
              key="roadmaps"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Map size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-bold">Choose Your Field</h2>
                  <p className="text-xs text-muted-foreground font-medium">Select a discipline to unlock its official roadmap.</p>
                </div>
              </div>

              {isRoadmapsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={36} /></div>
              ) : roadmaps?.length === 0 ? (
                <div className="p-10 border-2 border-dashed border-border rounded-[2rem] text-center bg-muted/10">
                  <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">No roadmaps available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roadmaps?.map((roadmap, idx) => (
                    <motion.div
                      key={roadmap.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                    >
                      <Card
                        className="glass border-none hover:bg-white dark:hover:bg-primary/5 transition-all duration-300 rounded-[2rem] overflow-hidden cursor-pointer group shadow-sm hover:shadow-2xl h-full flex flex-col"
                        onClick={() => safeWindowOpen(roadmap.fileUrl)}
                      >
                        {roadmap.thumbnailUrl && (
                          <div className="h-44 w-full overflow-hidden bg-primary/5 shrink-0">
                            <img src={roadmap.thumbnailUrl} alt={roadmap.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                        )}
                        {!roadmap.thumbnailUrl && (
                          <div className="h-44 w-full bg-primary/5 flex items-center justify-center shrink-0">
                            <Map size={48} className="text-primary/20" />
                          </div>
                        )}
                        <CardContent className="p-6 flex-1 flex flex-col">
                          <Badge variant="secondary" className="mb-3 uppercase text-[10px] font-black tracking-widest w-fit bg-primary/10 text-primary border-none">{roadmap.field}</Badge>
                          <h3 className="font-bold font-headline text-xl mb-2 group-hover:text-primary transition-colors leading-tight">{roadmap.title}</h3>
                          <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed flex-1">{roadmap.description}</p>
                          <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">View Roadmap</span>
                            <Download size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Study Materials ── */}
          {activeTab === 'materials' && (
            <motion.div
              key="materials"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-bold">Study Materials</h2>
                  <p className="text-xs text-muted-foreground font-medium">Search and download resources from the global repository.</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex gap-3 items-center bg-white dark:bg-card/50 p-3 rounded-2xl shadow-sm border border-border/40 backdrop-blur-md">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                  <input
                    placeholder="Search by title, subject or type..."
                    className="w-full pl-11 h-10 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/30 text-sm outline-none font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <Button className="h-10 px-6 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                  Filter
                </Button>
              </div>

              {isResourcesLoading ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-primary" size={40} />
                  <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Accessing Archives...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((item, idx) => (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Card className="bg-white dark:bg-card/40 border-none hover:bg-primary/[0.01] transition-all duration-300 rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-lg h-full flex flex-col border border-border/20 backdrop-blur-sm">
                          <CardContent className="p-8 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                              <div className="w-16 h-16 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                                {item.thumbnailUrl ? (
                                  <img src={item.thumbnailUrl} alt="Resource Icon" loading="lazy" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText size={28} className="text-primary" />
                                )}
                              </div>
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full">
                                {item.semester}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl md:text-2xl font-headline font-bold mb-3 tracking-tight line-clamp-2 leading-tight">{item.title}</h3>
                              <div className="space-y-1 mb-6">
                                <p className="text-primary text-xs font-black uppercase tracking-widest">{item.subject}</p>
                                <Badge variant="outline" className="text-muted-foreground/60 text-[9px] font-bold uppercase tracking-[0.2em] border-muted-foreground/20">
                                  {item.materialType}
                                </Badge>
                              </div>
                            </div>
                            <div className="pt-6 border-t border-border/40 flex items-center justify-between mt-4">
                              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                                {item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : 'N/A'}
                              </span>
                              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <Button variant="ghost" className="text-primary hover:bg-primary/5 px-4 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest h-10">
                                  Get File <Download size={16} />
                                </Button>
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {filtered.length === 0 && !isResourcesLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 text-muted-foreground/40 border-2 border-dashed border-border rounded-[3rem] bg-white/30 backdrop-blur-sm"
                >
                  <div className="p-6 bg-muted/20 w-fit mx-auto rounded-full mb-4">
                    <Search size={32} className="opacity-20" />
                  </div>
                  <p className="font-bold uppercase tracking-widest text-sm">No repository matches found.</p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
