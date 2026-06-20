"use client"

import React, { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Mail, RefreshCw, Send, AlertCircle } from 'lucide-react'

export default function BulkEmailTab() {
  const [sheetUrl, setSheetUrl] = useState('')
  const [parsedData, setParsedData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [manualEmails, setManualEmails] = useState('')
  const [senderName, setSenderName] = useState('TechXera Campus')
  const [senderEmail, setSenderEmail] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const savedName = localStorage.getItem('techxera_senderName')
    const savedEmail = localStorage.getItem('techxera_senderEmail')
    const savedReplyTo = localStorage.getItem('techxera_replyToEmail')
    const savedSmtpUser = localStorage.getItem('techxera_smtpUser')
    const savedSmtpPass = localStorage.getItem('techxera_smtpPass')
    
    if (savedName) setSenderName(savedName)
    if (savedEmail) setSenderEmail(savedEmail)
    if (savedReplyTo) setReplyToEmail(savedReplyTo)
    if (savedSmtpUser) setSmtpUser(savedSmtpUser)
    if (savedSmtpPass) setSmtpPass(savedSmtpPass)
  }, [])

  const saveDefaults = () => {
    localStorage.setItem('techxera_senderName', senderName)
    localStorage.setItem('techxera_senderEmail', senderEmail)
    localStorage.setItem('techxera_replyToEmail', replyToEmail)
    localStorage.setItem('techxera_smtpUser', smtpUser)
    localStorage.setItem('techxera_smtpPass', smtpPass)
    toast({ title: 'Settings Saved', description: 'Your custom email settings have been saved for next time.' })
  }

  const fetchSheetData = async () => {
    if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
      toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid Google Sheets URL.' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(sheetUrl)}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch the sheet. Ensure it is accessible (Anyone with the link can view).')
      }

      const csvText = await response.text()
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setParsedData(results.data)
            setHeaders(Object.keys(results.data[0] as object))
            setSelectedRows(new Set(results.data.map((_, i) => i)))
            toast({ title: 'Success', description: `Successfully imported ${results.data.length} rows.` })
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'The sheet appears to be empty.' })
          }
          setIsLoading(false)
        },
        error: (error: any) => {
          toast({ variant: 'destructive', title: 'Parse Error', description: error.message })
          setIsLoading(false)
        }
      })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Fetch Error', description: error.message })
      setIsLoading(false)
    }
  }

  const findEmailColumn = () => {
    return headers.find(h => h.toLowerCase().includes('email')) || null
  }

  const sendBulkEmails = async () => {
    const parsedManualEmails = manualEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'))
    const hasRecipients = parsedData.length > 0 || parsedManualEmails.length > 0
    
    if (!hasRecipients) return
    if (!emailSubject || !emailBody) {
      toast({ variant: 'destructive', title: 'Missing Info', description: 'Please enter a subject and message body.' })
      return
    }

    const allRecipients = new Set<string>()

    if (parsedData.length > 0) {
      const emailCol = findEmailColumn()
      if (!emailCol) {
        toast({ variant: 'destructive', title: 'No Email Column', description: 'Could not automatically find a column named "Email" in the sheet.' })
        return
      }
      for (let i = 0; i < parsedData.length; i++) {
        if (!selectedRows.has(i)) continue
        const recipientEmail = parsedData[i][emailCol]
        if (recipientEmail && recipientEmail.includes('@')) {
          allRecipients.add(recipientEmail)
        }
      }
    }

    parsedManualEmails.forEach(e => allRecipients.add(e))

    if (allRecipients.size === 0) {
      toast({ variant: 'destructive', title: 'No Recipients', description: 'No valid email addresses found to send to.' })
      return
    }

    setIsSending(true)
    let successCount = 0
    let failCount = 0

    for (const recipientEmail of Array.from(allRecipients)) {
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            to: recipientEmail, 
            subject: emailSubject, 
            body: emailBody,
            fromName: senderName,
            fromEmail: senderEmail,
            replyTo: replyToEmail,
            smtpUser: smtpUser,
            smtpPass: smtpPass
          })
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (e) {
        failCount++
      }
    }

    setIsSending(false)
    toast({
      title: 'Bulk Email Complete',
      description: `Sent: ${successCount}. Failed: ${failCount}.`,
      variant: failCount > 0 ? 'destructive' : 'default'
    })
  }

  const parsedManualEmails = manualEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'))
  const hasRecipients = parsedData.length > 0 || parsedManualEmails.length > 0
  const totalRecipients = (parsedData.length > 0 ? selectedRows.size : 0) + parsedManualEmails.length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Mail size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground">Bulk Emailer (Google Sheets)</h2>
          <p className="text-muted-foreground">Import student lists from a public Google Sheet and send emails to everyone instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1: Import */}
        <Card className="border-border/40 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <CardTitle className="text-lg">Step 1: Import Data</CardTitle>
            <CardDescription>Paste a public Google Sheet URL. The sheet MUST contain a column named "Email".</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Google Sheet URL</Label>
              <Input 
                placeholder="https://docs.google.com/spreadsheets/d/.../edit" 
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                className="bg-background/50 h-12 rounded-2xl"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <AlertCircle size={12} /> Ensure share settings are "Anyone with the link can view".
              </p>
            </div>
            <Button onClick={fetchSheetData} disabled={isLoading || !sheetUrl} className="w-full rounded-2xl h-12 font-bold">
              {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Fetch Sheet Data
            </Button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border/40"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase font-medium">AND / OR</span>
              <div className="flex-grow border-t border-border/40"></div>
            </div>
            <div className="space-y-2">
              <Label>Manual Email Addresses</Label>
              <Textarea 
                placeholder="student1@gmail.com, student2@gmail.com" 
                value={manualEmails}
                onChange={e => setManualEmails(e.target.value)}
                className="bg-background/50 min-h-[80px] rounded-2xl p-4"
              />
              <p className="text-xs text-muted-foreground">Separate multiple emails with commas.</p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Compose Email */}
        <Card className="border-border/40 shadow-sm rounded-3xl overflow-hidden opacity-100 transition-opacity">
          <CardHeader className="bg-muted/30 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Step 2: Compose & Send</CardTitle>
                <CardDescription>Draft the email message to send to all imported students.</CardDescription>
              </div>
              <Button onClick={saveDefaults} variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg border-primary/20 hover:bg-primary/5">
                Save Settings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auth Email (Optional Override)</Label>
                <Input 
                  placeholder="admin@techxera.com" 
                  value={smtpUser}
                  onChange={e => setSmtpUser(e.target.value)}
                  className="bg-background/50 h-10 rounded-xl"
                  disabled={!hasRecipients}
                />
              </div>
              <div className="space-y-2">
                <Label>App Password (Optional)</Label>
                <Input 
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx" 
                  value={smtpPass}
                  onChange={e => setSmtpPass(e.target.value)}
                  className="bg-background/50 h-10 rounded-xl"
                  disabled={!hasRecipients}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sender Name</Label>
                <Input 
                  placeholder="TechXera Admin" 
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="bg-background/50 h-10 rounded-xl"
                  disabled={!hasRecipients}
                />
              </div>
              <div className="space-y-2">
                <Label>Sender Email (From)</Label>
                <Input 
                  placeholder="admin@techxera.com" 
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  className="bg-background/50 h-10 rounded-xl"
                  disabled={!hasRecipients}
                />
              </div>
              <div className="space-y-2">
                <Label>Reply-To Email</Label>
                <Input 
                  placeholder="hr@techxera.com" 
                  value={replyToEmail}
                  onChange={e => setReplyToEmail(e.target.value)}
                  className="bg-background/50 h-10 rounded-xl"
                  disabled={!hasRecipients}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input 
                placeholder="Welcome to the program!" 
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="bg-background/50 h-10 rounded-xl"
                disabled={!hasRecipients}
              />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea 
                placeholder="Type your message here..." 
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                className="bg-background/50 min-h-[120px] rounded-2xl p-4"
                disabled={!hasRecipients}
              />
            </div>
            <Button 
              onClick={sendBulkEmails} 
              disabled={isSending || totalRecipients === 0} 
              className="w-full rounded-2xl h-12 font-bold bg-primary text-white hover:bg-primary/90"
            >
              {isSending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send to {totalRecipients} Selected Students
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card className="border-border/40 shadow-sm rounded-3xl overflow-hidden mt-8">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Data Preview
              <span className="text-sm font-normal text-muted-foreground">Found {parsedData.length} rows</span>
            </CardTitle>
          </CardHeader>
          <div className="p-0 overflow-auto max-h-[600px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/90 backdrop-blur-md text-muted-foreground uppercase text-xs sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <Checkbox 
                      checked={selectedRows.size === parsedData.length && parsedData.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRows(new Set(parsedData.map((_, idx) => idx)))
                        } else {
                          setSelectedRows(new Set())
                        }
                      }}
                      className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </th>
                  {headers.map((header, i) => (
                    <th key={i} className={`px-6 py-4 font-bold tracking-wider whitespace-nowrap max-w-[250px] truncate ${header.toLowerCase().includes('email') ? 'text-primary' : ''}`} title={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {parsedData.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 w-12 text-center">
                      <Checkbox 
                        checked={selectedRows.has(i)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedRows)
                          if (checked) newSet.add(i)
                          else newSet.delete(i)
                          setSelectedRows(newSet)
                        }}
                      />
                    </td>
                    {headers.map((header, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-foreground max-w-[300px] truncate" title={row[header]}>
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
