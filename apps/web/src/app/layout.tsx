import type { ReactNode } from 'react';
import { Outfit, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { GlobalHeader } from '../components/GlobalHeader';
import { ScrollToTop } from '../components/ScrollToTop';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'ClauseIQX — Enterprise AI Contract Intelligence',
  description: 'Understand, compare, and act on legal documents with cited, grounded explanations.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased bg-bg text-fg">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen">
            <GlobalHeader />

            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
