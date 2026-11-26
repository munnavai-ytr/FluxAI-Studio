import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FrameScript — Code-Driven AI Video Studio',
  description:
    'Create kinetic typography hooks, tech explainers, and short-form motion reels with your own Gemini API key.',
  openGraph: {
    title: 'FrameScript — Code-Driven AI Video Studio',
    description:
      'Create kinetic typography hooks, tech explainers, and short-form motion reels with your own Gemini API key.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FrameScript — Code-Driven AI Video Studio',
    description:
      'Create kinetic typography hooks, tech explainers, and short-form motion reels with your own Gemini API key.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0D12',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#0B0D12] text-[#F8FAFC] font-sans antialiased selection:bg-[#6366F1]/30 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
