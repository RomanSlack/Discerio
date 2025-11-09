import './globals.css'
import Navigation from '../components/Navigation'
import { ThemeProvider } from '../contexts/ThemeContext'

export const metadata = {
  title: 'Discer.io - Learn AI Agents Through Play',
  description: 'Educational MMO sandbox for designing and deploying agentic AI workflows using drag-and-drop programming blocks.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
        <Navigation />
        {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

