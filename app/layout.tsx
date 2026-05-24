import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Stitch — AI-native product OS',
  description: 'Autonomous product team: Research → PRD → Designer → Engineering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
