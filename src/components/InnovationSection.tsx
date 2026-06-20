"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, LayoutGrid, Rocket, GraduationCap, Users, Lightbulb, ArrowRight } from 'lucide-react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const TABS = [
  {
    id: 0,
    title: "Innovation Challenges",
    desc: "Run corporate challenges & hackathons to develop innovative solutions that will transform your business.",
    icon: <Box size={24} />,
    inactiveIconBg: "bg-blue-100 text-blue-600",
    activeBg: "bg-[#98c1fa]", // Blue
  },
  {
    id: 1,
    title: "Product Evangelism",
    desc: "Ignite customer excitement and drive product adoption through strategic evangelism. Join hosts seeing a 73% boost in adoption rates.",
    icon: <LayoutGrid size={24} />,
    inactiveIconBg: "bg-red-100 text-red-500",
    activeBg: "bg-[#ffbba6]", // Peach/Red
  },
  {
    id: 2,
    title: "Startup Pitches",
    desc: "Find the best startups in your industry to partner with and co-develop innovative...",
    icon: <Rocket size={24} />,
    inactiveIconBg: "bg-emerald-100 text-emerald-500",
    activeBg: "bg-[#a7f3d0]", // Emerald
  },
  {
    id: 3,
    title: "Student Challenges",
    desc: "Explore innovative ideas from student minds.",
    icon: <Lightbulb size={24} />,
    inactiveIconBg: "bg-yellow-100 text-yellow-500",
    activeBg: "bg-[#fde047]", // Yellow
  },
  {
    id: 4,
    title: "Recruitment",
    desc: "Connect with students globally to identify the brightest young minds and their...",
    icon: <Users size={24} />,
    inactiveIconBg: "bg-purple-100 text-purple-500",
    activeBg: "bg-[#d8b4fe]", // Purple
  },
  {
    id: 5,
    title: "Internal hackathon",
    desc: "Empower your workforce to drive change! Gather employee insights and...",
    icon: <GraduationCap size={24} />,
    inactiveIconBg: "bg-sky-100 text-sky-500",
    activeBg: "bg-[#bae6fd]", // Sky Blue
  }
]

export default function InnovationSection() {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedTabForModal, setSelectedTabForModal] = useState<any>(null)

  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  const title = settings?.innovationTitle || "In innovation, one size does not fit all"
  const subtitle = settings?.innovationSubtitle || "Transform your enterprise with the platform that drives a <strong className=\"text-primary\">73% boost in product adoption</strong> and reduces innovation costs by up to <strong className=\"text-primary\">90%</strong>. Innovate effortlessly with our network of 7 million innovators to bring solutions to market faster."

  let customTabs: any[] = []
  try {
    customTabs = settings?.innovationTabs ? JSON.parse(settings.innovationTabs) : []
  } catch (e) {}

  const dynamicTabs = TABS.map((defaultTab, idx) => {
    const custom = customTabs[idx] || {}
    return {
      ...defaultTab,
      title: custom.title || defaultTab.title,
      desc: custom.desc || defaultTab.desc,
      details: custom.details || ""
    }
  })

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-5xl font-headline font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-3xl mx-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: subtitle }} />
      </div>

      <div className="flex flex-col md:flex-row bg-white dark:bg-card border border-border/40 rounded-[2rem] shadow-sm overflow-hidden">
        {dynamicTabs.map((tab, idx) => {
          const isActive = activeTab === idx;
          return (
            <div
              key={tab.id}
              onMouseEnter={() => setActiveTab(idx)}
              className={`flex-1 p-5 md:p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                isActive ? `${tab.activeBg} text-black shadow-lg z-10 scale-[1.02] rounded-[2rem]` : 'hover:bg-muted/30 border-r border-border/40 last:border-r-0'
              }`}
            >
              {/* Background abstract circles for active state */}
              {isActive && (
                <div className="absolute -bottom-20 -right-20 opacity-20 pointer-events-none">
                  <div className="w-64 h-64 rounded-full border-[30px] border-white/40 absolute -right-10 -bottom-10" />
                  <div className="w-48 h-48 rounded-full border-[20px] border-white/60 absolute right-0 bottom-0" />
                </div>
              )}

              <div className="relative z-10 flex flex-col h-full space-y-4">
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white text-black' : tab.inactiveIconBg
                  }`}
                >
                  {tab.icon}
                </div>
                
                <div className="space-y-3">
                  <h3 className={`text-xl font-bold font-headline ${isActive ? 'text-black' : 'text-foreground'}`}>
                    {tab.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isActive ? 'text-black/80 font-medium' : 'text-muted-foreground'}`}>
                    {tab.desc}
                  </p>
                  
                  {isActive && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="pt-2">
                      <button 
                        onClick={() => setSelectedTabForModal(tab)}
                        className="inline-flex items-center text-xs font-black uppercase tracking-widest text-black/90 hover:text-black border-b-2 border-black/20 hover:border-black transition-colors pb-1"
                      >
                        Learn More <ArrowRight size={14} className="ml-1" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!selectedTabForModal} onOpenChange={(open) => !open && setSelectedTabForModal(null)}>
        <DialogContent className="sm:max-w-xl rounded-[2rem]">
          <DialogHeader className="mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 mb-6 ${selectedTabForModal?.activeBg || 'bg-primary'}`}>
              {selectedTabForModal?.icon}
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-headline font-bold">
              {selectedTabForModal?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">
              {selectedTabForModal?.desc}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {selectedTabForModal?.details}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
