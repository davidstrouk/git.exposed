import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
