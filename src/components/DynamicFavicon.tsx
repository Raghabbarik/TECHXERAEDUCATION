
"use client"

import { useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'

/**
 * DynamicFavicon - Aggressively synchronizes the browser tab icon.
 * Uses a combination of immediate application, interval polling, and MutationObserver
 * to ensure custom branding is never overwritten by framework defaults.
 */
export default function DynamicFavicon() {
  const db = useFirestore()
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    // The primary default icon URL
    const primaryIconUrl = 'https://i.postimg.cc/MZg1CbGc/1441541546-(1)-Photoroom.png';
    
    // Use admin override if present, otherwise fall back to primary
    const targetUrl = settings?.faviconUrl || settings?.logoUrl || primaryIconUrl;

    const applyIcon = () => {
      // Selectors for all common favicon and touch icon variants
      const selectors = [
        'link[rel*="icon"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="shortcut icon"]'
      ];
      
      const existingLinks = document.querySelectorAll(selectors.join(','));
      
      // Use cache-busting timestamp to force immediate browser refresh
      // Using 'v=' instead of 'cache=' for standard browser compatibility
      const dynamicHref = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

      if (existingLinks.length > 0) {
        // Claim every existing tag to prevent default icons from showing
        existingLinks.forEach(link => {
          const l = link as HTMLLinkElement;
          if (l.href !== dynamicHref) {
            l.href = dynamicHref;
          }
        });
      } else {
        // Create a new primary icon if none exist (should not happen with Next.js but safe to have)
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = dynamicHref;
        document.head.appendChild(newLink);
      }
    };

    // Execute immediately on mount/update
    applyIcon();

    // 1. Polling fallback: Check every 3 seconds to ensure icon persistence
    const pollingInterval = setInterval(applyIcon, 3000);

    // 2. MutationObserver: Watch the <head> for any external attempts to modify icons
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // If elements are added/removed or attributes changed in head, re-verify icon
          applyIcon();
        }
      }
    });

    observer.observe(document.head, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['href', 'rel'] 
    });
    
    return () => {
      clearInterval(pollingInterval);
      observer.disconnect();
    };

  }, [settings?.faviconUrl, settings?.logoUrl])

  return null
}
