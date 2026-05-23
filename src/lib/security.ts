/**
 * Shared security & safety utilities
 */

// ── Sanitize Firebase error messages (don't leak internals to users) ──
const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential':        'Invalid email or password.',
  'auth/user-not-found':            'No account found with this email.',
  'auth/wrong-password':            'Incorrect password.',
  'auth/email-already-in-use':      'An account with this email already exists.',
  'auth/weak-password':             'Password must be at least 6 characters.',
  'auth/too-many-requests':         'Too many attempts. Please try again later.',
  'auth/network-request-failed':    'Network error. Check your connection.',
  'auth/invalid-email':             'Please enter a valid email address.',
  'auth/user-disabled':             'This account has been disabled.',
  'permission-denied':              'You do not have permission to do this.',
  'unavailable':                    'Service temporarily unavailable.',
}

export function safeErrorMessage(error: any): string {
  const code = error?.code || ''
  return FIREBASE_ERRORS[code] || 'Something went wrong. Please try again.'
}

// ── Prevent open redirect attacks ──
export function safeRedirect(url: string, fallback = '/'): string {
  try {
    // Only allow relative paths (starting with /)
    if (!url || !url.startsWith('/') || url.startsWith('//')) return fallback
    // Block absolute URLs
    new URL(url, 'http://localhost') // throws if malformed
    return url
  } catch {
    return fallback
  }
}

// ── Safe date formatting (prevents crashes on null/invalid dates) ──
export function safeFormat(dateValue: any, formatFn: (d: Date) => string, fallback = 'N/A'): string {
  try {
    if (!dateValue) return fallback
    const d = new Date(dateValue)
    if (isNaN(d.getTime())) return fallback
    return formatFn(d)
  } catch {
    return fallback
  }
}

// ── Safe window.open with security attributes ──
export function safeWindowOpen(url: string): void {
  if (!url) return
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (win) win.opener = null
}
