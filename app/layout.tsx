import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ninety-Nine Card Game',
  description: 'A classic card game of Ninety-Nine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-green-900">
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
