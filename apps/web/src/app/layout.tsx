import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from '@/components/providers';
import { UserMenu } from '@/components/user-menu';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'git.exposed — Is your code exposed?',
  description:
    'Scan any public GitHub repo for security vulnerabilities, exposed secrets, and code quality issues. Get a Vibe Safety Score in seconds.',
  metadataBase: new URL('https://git.exposed'),
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'git.exposed — Is your code exposed?',
    description: 'Scan any public GitHub repo for security vulnerabilities, exposed secrets, and code quality issues.',
    siteName: 'git.exposed',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'git.exposed — Is your code exposed?',
    description: 'Scan any public GitHub repo for security vulnerabilities, exposed secrets, and code quality issues.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="font-sans antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-slate-800 focus:text-slate-200 focus:px-4 focus:py-2 focus:rounded-lg">
          Skip to content
        </a>
        <Providers>
          <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/70 border-b border-ds-border/10">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-200">
              <img src="/logo.svg" alt="" className="h-7 w-7" aria-hidden="true" />
              git.<span className="text-red-500">exposed</span>
            </Link>
            <UserMenu />
          </header>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
