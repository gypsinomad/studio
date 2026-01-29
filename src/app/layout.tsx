'use client';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

// Since this is the root layout, we can't use 'use client' directly for metadata.
// export const metadata: Metadata = {
//   title: 'SpiceRoute CRM',
//   description: 'A CRM for spice export businesses.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SpiceRoute CRM</title>
        <meta name="description" content="A CRM for spice export businesses." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
            {children}
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
