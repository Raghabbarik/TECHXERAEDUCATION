import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// ─────────────────────────────────────────────
// Input sanitizer — strips dangerous HTML tags
// ─────────────────────────────────────────────
function sanitize(str: string): string {
  return str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    // ── Origin check: parse properly to avoid false 403s on Vercel ──
    const origin = req.headers.get('origin') || ''
    const host = req.headers.get('host') || ''
    if (origin) {
      try {
        const originHost = new URL(origin).host  // strips https:// correctly
        if (originHost !== host) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await req.json()
    const { to, subject, body: msgBody, fromName: customFromName, replyTo, fromEmail, smtpUser, smtpPass } = body

    // ── Validate required fields ──
    if (!to || !msgBody) {
      return NextResponse.json({ error: 'Missing required fields: to, body' }, { status: 400 })
    }

    // ── Validate recipient list ──
    const toList: string[] = Array.isArray(to) ? to : [to]

    if (toList.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    // Limit max recipients per request to prevent abuse
    if (toList.length > 100) {
      return NextResponse.json({ error: 'Too many recipients. Max 100 per request.' }, { status: 400 })
    }

    // Validate each email address
    const invalidEmails = toList.filter(e => !isValidEmail(e))
    if (invalidEmails.length > 0) {
      return NextResponse.json({ error: `Invalid email addresses: ${invalidEmails.slice(0, 3).join(', ')}` }, { status: 400 })
    }

    // ── Sanitize inputs ──
    const cleanSubject = sanitize(subject || 'Message from TechXera Campus Admin').slice(0, 200)
    const cleanBody = sanitize(msgBody).slice(0, 5000)

    if (!cleanBody) {
      return NextResponse.json({ error: 'Message body cannot be empty after sanitization' }, { status: 400 })
    }

    // ── Check credentials ──
    const emailUser = smtpUser
    const emailPass = smtpPass
    const fromName = customFromName || 'TechXera Campus'

    if (!emailUser || !emailPass) {
      console.error('[send-email] Missing SMTP credentials from client payload')
      return NextResponse.json(
        { error: 'Email credentials not provided. Please enter From Email and App Password.' },
        { status: 400 }
      )
    }

    // ── Explicit SMTP config (more reliable on Vercel serverless than service:'gmail') ──
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: true },
    })

    // ── HTML template ──
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #306D29, #0D530E); padding: 32px; text-align: center; }
            .header h1 { color: #FBF5DD; font-size: 22px; margin: 0; letter-spacing: 1px; }
            .header p { color: #FBF5DDaa; font-size: 12px; margin: 6px 0 0; }
            .body { padding: 36px 32px; color: #1a1a1a; font-size: 15px; line-height: 1.7; white-space: pre-wrap; }
            .footer { background: #f0f0f0; padding: 20px 32px; text-align: center; font-size: 11px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 TechXera Campus</h1>
              <p>Official Communication from Admin</p>
            </div>
            <div class="body">${cleanBody.replace(/\n/g, '<br/>')}</div>
            <div class="footer">
              This message was sent from TechXera Campus Admin Portal.<br/>
              Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `

    // ── Send emails ──
    const results = await Promise.allSettled(
      toList.map((email: string) =>
        transporter.sendMail({
          from: `"${fromName}" <${fromEmail || emailUser}>`,
          replyTo: replyTo || emailUser,
          to: email,
          subject: cleanSubject,
          html: htmlBody,
          text: cleanBody,
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message || 'Unknown error')

    if (errors.length > 0) {
      console.error('[send-email] Some emails failed:', errors)
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      message: `Email sent to ${sent} recipient(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      ...(failed > 0 && { errors }),
    })
  } catch (error: any) {
    console.error('[send-email] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error?.message },
      { status: 500 }
    )
  }
}
