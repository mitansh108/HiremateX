import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Job Posting Extractor',
  description: 'Extract job details from job posting URLs using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}