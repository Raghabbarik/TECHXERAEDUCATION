
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Briefcase, Video, FileText, MessageSquare, BookOpen,
  Loader2, Download, ChevronDown, ChevronUp, CalendarDays,
  Clock, Building2, ExternalLink, StickyNote, Play
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase'
import { collection, query, where, orderBy, doc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { TechXeraLogo } from '@/components/Navbar'
import { format } from 'date-fns'
import { safeFormat } from '@/lib/security'

const CONTENT_ICONS: Record<string, React.ReactNode> = {
  video: <Play size={16} className="text-blue-500" />,
  message: <MessageSquare size={16} className="text-green-500" />,
  note: <StickyNote size={16} className="text-yellow-500" />,
  record: <FileText size={16} className="text-purple-500" />,
  file: <Download size={16} className="text-pink-500" />,
}

const CONTENT_COLORS: Record<string, string> = {
  video: 'bg-blue-500/10 text-blue-600',
  message: 'bg-green-500/10 text-green-600',
  note: 'bg-yellow-500/10 text-yellow-600',
  record: 'bg-purple-500/10 text-purple-600',
  file: 'bg-pink-500/10 text-pink-600',
}

// Sub-component: renders daily content for one internship
function InternshipContent({ internshipId, db }: { internshipId: string; db: any }) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const contentRef = useMemoFirebase(
    () => db ? query(collection(db, 'internships', internshipId, 'content'), orderBy('day', 'asc')) : null,
    [db, internshipId]
  )
  const { data: contentItems, isLoading } = useCollection(contentRef)

  // Group by day
  const byDay: Record<number, any[]> = {}
  contentItems?.forEach((item: any) => {
    if (!byDay[item.day]) byDay[item.day] = []
    byDay[item.day].push(item)
  })
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b)

  if (isLoading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  )

  if (days.length === 0) return (
    <div className="p-8 border-2 border-dashed border-border/30 rounded-2xl text-center">
      <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">No content uploaded yet.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {days.map(day => {
        const items = byDay[day]
        const isOpen = expandedDay === `${internshipId}-day-${day}`
        return (
          <div key={day} className="rounded-2xl border border-border/20 overflow-hidden bg-background/30">
            {/* Day header */}
            <button
              onClick={() => setExpandedDay(isOpen ? null : `${internshipId}-day-${day}`)}
              className="w-full flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-black text-sm">{day}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Day {day}</p>
                <p className="text-[11px] text-muted-foreground">
                  {items.length} item{items.length !== 1 ? 's' : ''} — {items.map((i: any) => i.type).join(', ')}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {[...new Set(items.map((i: any) => i.type))].map((type: any) => (
                  <span key={type} className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${CONTENT_COLORS[type] || 'bg-muted text-muted-foreground'}`}>
                    {type}
                  </span>
                ))}
              </div>
              {isOpen ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>

            {/* Day content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border/20 bg-muted/5"
                >
                  <div className="p-4 space-y-3">
                    {items.map((item: any) => (
                      <div key={item.id} className="bg-background/80 rounded-xl p-4 border border-border/20">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${CONTENT_COLORS[item.type] || 'bg-muted'}`}>
                            {CONTENT_ICONS[item.type] || <FileText size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold text-sm">{item.title}</span>
                              <Badge className={`text-[9px] border-none font-bold ${CONTENT_COLORS[item.type] || ''}`}>
                                {item.type}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-wrap">{item.description}</p>
                            )}
                            {/* Video embed */}
                            {item.type === 'video' && item.url && (
                              <div className="mt-2">
                                {(() => {
                                  const url = item.url;
                                  let embedUrl = '';
                                  let isDirectVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
                                  
                                  // Robust YouTube ID extraction
                                  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                                  if (ytMatch && ytMatch[1]) {
                                    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                                  } else if (url.includes('drive.google.com') || url.includes('docs.google.com/video')) {
                                    embedUrl = url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
                                  }

                                  if (isDirectVideo) {
                                    return (
                                      <div className="rounded-xl overflow-hidden aspect-video bg-black">
                                        <video src={url} controls className="w-full h-full" />
                                      </div>
                                    );
                                  } else if (embedUrl) {
                                    return (
                                      <div className="space-y-2 mt-2">
                                        <div className="rounded-xl overflow-hidden aspect-video bg-black">
                                          <iframe
                                            src={embedUrl}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        </div>
                                        {/* Fallback button if iframe is blocked by X-Frame-Options or embedding is disabled */}
                                        <div className="flex justify-end">
                                          <a href={url} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="rounded-xl gap-2 text-xs">
                                              <ExternalLink size={12} /> Open in New Tab
                                            </Button>
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    // Fallback for other video links
                                    return (
                                      <a href={url} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" className="rounded-xl gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                                          <Play size={14} /> Watch Video
                                        </Button>
                                      </a>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                            {/* File/Record download */}
                            {(item.type === 'file' || item.type === 'record') && item.url && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="rounded-xl gap-2 mt-2">
                                  <Download size={14} /> Download
                                </Button>
                              </a>
                            )}
                            {/* External link */}
                            {item.type === 'note' && item.url && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="rounded-xl gap-2 mt-2">
                                  <ExternalLink size={14} /> Open Link
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// Main student internship page
export default function InternshipPage() {
  const [mounted, setMounted] = useState(false)
  const [expandedInternship, setExpandedInternship] = useState<string | null>(null)
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const studentRef = useMemoFirebase(
    () => (user && db ? doc(db, 'students', user.uid) : null),
    [user, db]
  )
  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push('/login?redirect=/internship')
    if (mounted && !isUserLoading && !isProfileLoading && user && profile && !profile.isApproved) router.push('/dashboard')
  }, [user, isUserLoading, isProfileLoading, profile, router, mounted])

  // Fetch internships where this student is assigned
  const internshipsRef = useMemoFirebase(
    () => (db && user ? query(
      collection(db, 'internships'),
      where('studentIds', 'array-contains', user.uid)
    ) : null),
    [db, user]
  )
  const { data: internshipsRaw, isLoading: isInternshipsLoading } = useCollection(internshipsRef)

  // Sort client-side to avoid composite index requirement
  const internships = internshipsRaw
    ? [...internshipsRaw].sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    : internshipsRaw

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
          <TechXeraLogo className="w-16 h-16 opacity-50" />
        </motion.div>
      </div>
    )
  }

  if (!user || !profile?.isApproved) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 md:p-14 pt-72 pb-32 space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter">My Internships</h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            Your assigned internship & placement programs. Access daily content, videos, notes and records uploaded by your admin.
          </p>
        </div>

        {/* Internship list */}
        {isInternshipsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : !internships?.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 border-2 border-dashed border-border rounded-[3rem] bg-muted/10"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Briefcase size={36} className="text-primary/40" />
            </div>
            <h2 className="text-xl font-bold font-headline mb-2">No Internships Assigned</h2>
            <p className="text-muted-foreground text-sm">Your admin hasn't assigned any internship program to you yet.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {internships.map((intern: any, idx: number) => {
              const isOpen = expandedInternship === intern.id
              return (
                <motion.div
                  key={intern.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="rounded-[2rem] border border-border/20 overflow-hidden bg-white/50 dark:bg-card/30 shadow-sm hover:shadow-lg transition-shadow"
                >
                  {/* Header row */}
                  <div
                    className="flex items-center gap-5 p-6 cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => setExpandedInternship(isOpen ? null : intern.id)}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 size={26} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h2 className="font-bold font-headline text-xl">{intern.title}</h2>
                        <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black tracking-widest uppercase">
                          {intern.type || 'Internship'}
                        </Badge>
                        {intern.status === 'active' && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black">🟢 Active</Badge>
                        )}
                        {intern.status === 'completed' && (
                          <Badge className="bg-muted text-muted-foreground border-none text-[9px] font-black">✓ Completed</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{intern.company}</p>
                      <div className="flex items-center gap-4 mt-1">
                        {intern.startDate && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <CalendarDays size={11} /> {safeFormat(intern.startDate, d => format(d, 'dd MMM yyyy'))}
                            {intern.endDate && <> → {safeFormat(intern.endDate, d => format(d, 'dd MMM yyyy'))}</>}
                          </span>
                        )}
                        {intern.duration && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={11} /> {intern.duration}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isOpen
                        ? <ChevronUp size={20} className="text-muted-foreground" />
                        : <ChevronDown size={20} className="text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-border/20"
                      >
                        <div className="p-6 space-y-6">
                          {/* Description */}
                          {intern.description && (
                            <div className="bg-muted/20 rounded-2xl p-5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">About</p>
                              <p className="text-sm leading-relaxed">{intern.description}</p>
                            </div>
                          )}

                          {/* Daily content */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                              Daily Content
                            </p>
                            <InternshipContent internshipId={intern.id} db={db} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
