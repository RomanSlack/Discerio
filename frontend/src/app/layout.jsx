import './globals.css'
import Navigation from '../components/Navigation'
import { ThemeProvider } from '../contexts/ThemeContext'

export const metadata = {
  title: 'Discer.io - Learn AI Agents Through Play',
  description: 'Educational MMO sandbox for designing and deploying agentic AI workflows using drag-and-drop programming blocks.',
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

