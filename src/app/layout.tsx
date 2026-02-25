'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { Inter, Playfair_Display } from 'next/font/google';
import { DebugMonitor } from '@/components/debug/debug-monitor';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} h-full`}>
      <head>
        <title>SpiceRoute CRM</title>
        <meta name="description" content="A CRM for spice export businesses." />
        <meta name="theme-color" content="#D97706" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SpiceRoute" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/spice/180/180" />
      </head>
      <body className="font-body antialiased bg-background h-full overflow-hidden" suppressHydrationWarning>
        <FirebaseClientProvider>
            {children}
            <Toaster />
            <DebugMonitor />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
