"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Box, Code, Download, ExternalLink, Loader2, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const projectsQuery = useMemoFirebase(() => (db ? query(collection(db, 'projects'), orderBy('createdAt', 'desc')) : null), [db])
  const { data: allProjects, isLoading: isLoadingProjects } = useCollection(projectsQuery)

  const filteredProjects = allProjects?.filter(project => 
    project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.techStack?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col pt-24 pb-32">
      <TechBackground />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-widest text-[10px]">
            TechXera Labs
          </Badge>
          <h1 className="text-4xl md:text-5xl font-headline font-bold">Project Gateway</h1>
          <p className="text-muted-foreground text-lg">
            Download source code, explore real-world applications, and rapidly prototype your own software.
          </p>
        </div>

        <div className="w-full max-w-xl mx-auto relative">
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name, or technology..." 
            className="h-14 bg-background/50 backdrop-blur-sm rounded-full pl-14 text-base border-none ring-1 ring-border shadow-2xl focus-visible:ring-primary"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={20} />
        </div>

        {isLoadingProjects ? (
          <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-primary/10 transition-all group">
                  <CardContent className="p-8 flex flex-col flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {project.thumbnailUrl ? (
                         <img src={project.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                         <Code size={24} />
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold font-headline leading-tight line-clamp-1">{project.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                          Published {format(new Date(project.createdAt), 'MMMM yyyy')}
                        </p>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">{project.description}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {project.techStack?.split(',').map((tech: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-bold">
                            {tech.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-8 mt-auto">
                      <Button asChild className="w-full h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                        <a href={project.fileUrl} target="_blank" rel="noreferrer">
                          {project.fileUrl?.includes('github') ? (
                            <><ExternalLink className="mr-2" size={16} /> View Repository</>
                          ) : (
                            <><Download className="mr-2" size={16} /> Download Source</>
                          )}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-24 text-center">
                <Box size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground">No projects found.</h3>
                <p className="text-muted-foreground/60 w-full max-w-sm mx-auto">Try adjusting your search keywords or check back later for new uploads.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
