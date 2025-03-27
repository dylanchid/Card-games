import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Initialize Inter font
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ninety-Nine Card Game',
  description: 'A classic trick-taking card game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full w-full ${inter.className}`} suppressHydrationWarning>
      <body className="h-full w-full font-sans antialiased">
        <Providers>
          <div className="game-container">
            <div className="game-table">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
