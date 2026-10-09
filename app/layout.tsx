import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'PrimeCut AI — Professional AI Video Studio',
  description: 'Full-stack AI video creation and multi-track editing workspace with Gemini script breakdown, stock media search, web research, timeline editing, and canvas video rendering.',
  openGraph: {
    title: 'PrimeCut AI — Professional AI Video Studio',
    description: 'Full-stack AI video creation and multi-track editing workspace with Gemini script breakdown, stock media search, web research, timeline editing, and canvas video rendering.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrimeCut AI — Professional AI Video Studio',
    description: 'Full-stack AI video creation and multi-track editing workspace with Gemini script breakdown, stock media search, web research, timeline editing, and canvas video rendering.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
