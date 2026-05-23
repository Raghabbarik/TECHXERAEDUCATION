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
    // ── Origin check: only allow requests from same origin ──
    const origin = req.headers.get('origin') || ''
    const host = req.headers.get('host') || ''
    if (origin && !origin.includes(host.split(':')[0])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { to, subject, body: msgBody } = body

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
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const fromName = process.env.EMAIL_FROM_NAME || 'TechXera Campus'

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { error: 'Email credentials not configured.' },
        { status: 500 }
      )
    }

    // ── Create transporter ──
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
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
          from: `"${fromName}" <${emailUser}>`,
          to: email,
          subject: cleanSubject,
          html: htmlBody,
          text: cleanBody,
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      sent,
      failed,
      message: `Email sent to ${sent} recipient(s)${failed > 0 ? `, ${failed} failed` : ''}`,
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
