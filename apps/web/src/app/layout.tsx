import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
        <Providers>
          <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
            <a href="/" className="text-lg font-bold text-slate-200">
              git.<span className="text-red-500">exposed</span>
            </a>
            <UserMenu />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
