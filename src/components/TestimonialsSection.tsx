"use client"

import React from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function TestimonialsSection() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  let testimonials = []
  try {
    testimonials = settings?.testimonialsData ? JSON.parse(settings.testimonialsData) : []
  } catch (e) {}

  if (!testimonials || testimonials.length === 0) {
    testimonials = [
      { name: "Nancy Hwang", role: "Head of Customer Experience, Google", text: "Team brings a ton of understanding of developer basis, and brings insights on what's challenging and how we as Google can...", avatarUrl: "https://i.pravatar.cc/150?img=1", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
      { name: "Kavita Aroor", role: "Head of Developer Marketing, APJ", text: "Great Coordination & Execution! Great team work! Overall a great show!", avatarUrl: "https://i.pravatar.cc/150?img=2", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Intel_logo_%282020%2C_light_blue%29.svg" },
      { name: "Monali Guha Thakurta", role: "Developer Marketing Manager, APAC", text: "Hack2skill's global reach ensured efficient outreach across multiple countries...", avatarUrl: "https://i.pravatar.cc/150?img=3", logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" }
    ]
  }

  return (
    <section className="relative py-24 overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <h2 className="text-3xl md:text-5xl font-headline font-bold text-center text-foreground mb-16">
          Don't just take our word for it, take theirs
        </h2>

        <div className="relative px-4 md:px-12">
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {testimonials.map((item: any, idx: number) => (
                <CarouselItem key={idx} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3 flex">
                  <div className="flex flex-col bg-white dark:bg-card border border-border/40 rounded-3xl p-8 shadow-sm h-full w-full relative hover:-translate-y-2 hover:shadow-xl hover:scale-[1.02] hover:z-10 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-4 mb-6">
                      {item.avatarUrl ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-border">
                          <img src={item.avatarUrl} alt={item.name} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {item.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-foreground">{item.name}</h4>
                        <p className="text-xs text-muted-foreground italic">{item.role}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                      {item.text}
                    </p>

                    {item.logoUrl && (
                      <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-start h-12">
                        <img src={item.logoUrl} alt="Company Logo" className="max-h-8 max-w-[120px] object-contain opacity-80" />
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="h-12 w-12 bg-white hover:bg-gray-50 border-gray-200 shadow-lg text-primary -left-6" />
              <CarouselNext className="h-12 w-12 bg-white hover:bg-gray-50 border-gray-200 shadow-lg text-primary -right-6" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}
