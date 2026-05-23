
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Eye, Server, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SecurityPage() {
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
            <Shield size={16} /> Technical Integrity
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">Security Protocols</h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
            How we protect your academic data and identity within the TechXera ecosystem.
          </p>
        </motion.div>

        <div className="grid gap-8">
          {[
            {
              title: "End-to-End Encryption",
              desc: "All communication between your device and our servers is encrypted using industry-standard TLS protocols. Your results and personal data are transmitted securely at all times.",
              icon: <Lock size={24} />
            },
            {
              title: "Granular Access Control",
              desc: "We employ strictly enforced Firestore Security Rules. Only authorized students can view their own results, and only approved administrators can modify academic records.",
              icon: <Eye size={24} />
            },
            {
              title: "Identity Verification",
              desc: "Multi-factor administrative sign-in ensures that campus data management is restricted to verified IT personnel. Student accounts require roll number validation.",
              icon: <CheckCircle2 size={24} />
            },
            {
              title: "Infrastructure Resilience",
              desc: "Hosted on high-availability Firebase infrastructure, protected by Google Cloud's advanced DDoS protection and automated backup systems.",
              icon: <Server size={24} />
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass border-none rounded-[2rem] overflow-hidden shadow-lg">
                <CardContent className="p-8 flex items-start gap-6">
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0">
                    {item.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-headline font-bold">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
