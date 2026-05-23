
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, Info, FileText, UserCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="max-w-4xl mx-auto w-full px-6 pt-32 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-black tracking-[0.2em] uppercase">
            <ShieldCheck size={16} /> Data Sovereignty
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">Privacy Policy</h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
            Transparent data handling for the TechXera student community.
          </p>
        </motion.div>

        <Card className="glass border-none rounded-[3rem] shadow-xl overflow-hidden mb-12">
          <CardContent className="p-10 md:p-16 space-y-12">
            <section className="space-y-4">
              <h2 className="text-3xl font-headline font-bold flex items-center gap-4">
                <UserCircle className="text-primary" /> Data Collection
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg font-medium">
                We collect information necessary for academic management, including your name, campus roll number, date of birth, and email address. This data is exclusively used for profile management and result delivery.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-headline font-bold flex items-center gap-4">
                <FileText className="text-primary" /> Academic Records
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg font-medium">
                Your examination results, grades, and semester progress are stored securely. These records are accessible only by you and the authorized academic registrar. We do not share your grades with third-party entities.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-headline font-bold flex items-center gap-4">
                <Info className="text-primary" /> Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg font-medium">
                As a TechXera student, you have the right to access your data, request corrections to your profile, and receive a digital transcript of your records. For account deletion, please contact the IT support hub.
              </p>
            </section>
          </CardContent>
        </Card>
        
        <div className="text-center text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-50">
          Last Updated: January 2025
        </div>
      </main>
    </div>
  )
}
