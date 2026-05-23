
"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle, Mail, MessageSquare, LifeBuoy, Loader2, Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { useFirestore } from '@/firebase'
import { collection, addDoc } from 'firebase/firestore'

const faqs = [
  {
    question: "How do I access my exam results?",
    answer: "You can access your results through the 'Results' tab in the navigation bar. You will need your Roll Number and Date of Birth to retrieve your digital transcript."
  },
  {
    question: "My account is pending approval. How long does it take?",
    answer: "Account approvals typically take 24-48 business hours. If your account hasn't been approved after this period, please contact the Registrar's office with your Student ID."
  },
  {
    question: "Where can I find lecture notes and coding guides?",
    answer: "All academic resources are hosted in the 'Repository'. You can search by subject, semester, or material type (e.g., Notes, Previous Questions)."
  },
  {
    question: "How do I update my profile picture?",
    answer: "Go to your 'Dashboard' and click on the camera icon over your profile image. Provide a valid image URL to update your avatar across the portal."
  }
]

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const { toast } = useToast()
  const db = useFirestore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    setIsSubmitting(true)
    
    try {
      await addDoc(collection(db, 'support_inquiries'), {
        ...formData,
        timestamp: new Date().toISOString(),
        status: 'pending'
      })

      toast({
        title: "Inquiry Sent",
        description: "A support ticket has been created. Our team will reach out via email.",
      })
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not send inquiry. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 space-y-6"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-black tracking-[0.2em] uppercase">
            <LifeBuoy size={16} /> Technical Assistance
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">Campus Support</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl font-medium leading-relaxed">
            Need help with the student portal? Browse our frequently asked questions or submit a technical inquiry to our support team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                <HelpCircle size={28} />
              </div>
              <h2 className="text-3xl font-headline font-bold">Common Queries</h2>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-none bg-white/50 dark:bg-black/10 backdrop-blur-sm rounded-[2rem] px-8 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <AccordionTrigger className="text-left py-6 hover:no-underline font-bold text-lg hover:text-primary transition-colors focus:outline-none">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="glass border-none shadow-2xl rounded-[3rem] overflow-hidden">
              <CardHeader className="p-10 bg-primary/5 border-b border-border/40">
                <div className="flex items-center gap-4 mb-2">
                  <MessageSquare size={24} className="text-primary" />
                  <CardTitle className="text-2xl font-headline font-bold">Contact Tech Support</CardTitle>
                </div>
                <CardDescription className="text-base font-medium">
                  Response time: Usually within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Name</Label>
                      <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Alex Smith" className="h-12 rounded-xl bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Campus Email</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="alex@techxera.edu" className="h-12 rounded-xl bg-background/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Subject</Label>
                    <Input id="subject" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Issue with results access" className="h-12 rounded-xl bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs uppercase font-black tracking-widest text-muted-foreground">Message</Label>
                    <Textarea id="message" required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Detailed description of your problem..." className="min-h-[150px] rounded-xl bg-background/50" />
                  </div>
                  <Button disabled={isSubmitting} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" size={20} />}
                    {isSubmitting ? 'Transmitting...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 flex items-center justify-center gap-8">
              <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
                <Mail size={18} className="text-primary" /> support@techxera.edu
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
                <Sparkles size={18} className="text-primary" /> 24/7 Ticketing
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
