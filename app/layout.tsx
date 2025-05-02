import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner';
import { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MerchX - Inventory Management',
  description: 'Manage your business inventory with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          themes={['light', 'dark']}
          forcedTheme={undefined}
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header />
            <main className="pt-20 flex-grow">
              {children}
            </main>
            <Footer />
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
