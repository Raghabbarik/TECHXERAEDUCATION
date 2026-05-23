
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import DynamicFavicon from '@/components/DynamicFavicon';
import NavigationButtons from '@/components/NavigationButtons';

export const metadata: Metadata = {
  title: 'TechXera Campus | Empowering Students',
  description: 'A modern campus portal for tech-forward students.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: 'https://i.postimg.cc/MZg1CbGc/1441541546-(1)-Photoroom.png', sizes: 'any' }
    ],
    shortcut: 'https://i.postimg.cc/MZg1CbGc/1441541546-(1)-Photoroom.png',
    apple: 'https://i.postimg.cc/MZg1CbGc/1441541546-(1)-Photoroom.png',
  },
  verification: {
    google: 'gtIa6bOLhjlXT0mviiXWAZRKv-gdcWvqcGha8KK8_yM',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TechXera Campus',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#306D29',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <DynamicFavicon />
            <NavigationButtons />
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
