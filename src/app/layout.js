import { Rubik } from "next/font/google";
import "./globals.css";
import UserAuthSessionProvider from "@/providers/UserAuthSessionProvider";
import HeroUIThemeProvider from "@/providers/HeroUIThemeProvider";
import { Toaster } from 'react-hot-toast';


const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata = {
  title: "QuestWhisper - AI Voice Assistant & Google Workspace Integration",
  description: "QuestWhisper is your intelligent AI companion with voice capabilities, Google Workspace integration, and web search. Experience natural conversations, manage emails, documents, and get real-time information through voice commands. The ultimate whisper AI assistant for productivity.",
  keywords: "QuestWhisper, AI assistant, voice AI, whisper AI, Google Workspace, voice commands, AI companion, artificial intelligence, productivity, Gmail integration, voice chat, smart assistant, quest AI, whisper assistant, AI voice assistant, Google Drive integration, voice search, AI productivity tool",
  authors: [{ name: "QuestWhisper Team" }],
  creator: "QuestWhisper",
  publisher: "QuestWhisper",
  category: "Technology",
  classification: "AI Assistant",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://iwhispered.com',
    siteName: 'QuestWhisper',
    title: 'QuestWhisper - AI Voice Assistant & Google Workspace Integration',
    description: 'QuestWhisper is your intelligent AI companion with voice capabilities, Google Workspace integration, and web search. Experience natural conversations, manage emails, documents, and get real-time information through voice commands.',
    images: [
      {
        url: '/og_banner.png',
        width: 1200,
        height: 630,
        alt: 'QuestWhisper - AI Voice Assistant with Google Workspace Integration',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@questwhisper',
    creator: '@questwhisper',
    title: 'QuestWhisper - AI Voice Assistant & Google Workspace Integration',
    description: 'Your intelligent AI companion with voice capabilities, Google Workspace integration, and web search. Experience natural conversations and productivity.',
    images: ['/og_banner.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://iwhispered.com'),
  alternates: {
    canonical: 'https://iwhispered.com',
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="keywords" content="QuestWhisper, AI assistant, voice AI, whisper AI, Google Workspace, voice commands, AI companion, artificial intelligence, productivity, Gmail integration, voice chat, smart assistant, quest AI, whisper assistant, AI voice assistant, Google Drive integration, voice search, AI productivity tool" />
        <meta name="theme-color" content="#4f7269" />
        <meta name="application-name" content="QuestWhisper" />
        <meta name="apple-mobile-web-app-title" content="QuestWhisper" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#4f7269" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Structured Data for AI Assistant */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "QuestWhisper",
              "description": "AI-powered voice assistant with Google Workspace integration",
              "url": "https://iwhispered.com",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "QuestWhisper"
              },
              "featureList": [
                "Voice AI Assistant",
                "Google Workspace Integration",
                "Web Search",
                "Voice Commands",
                "Gmail Management",
                "Document Creation",
                "Calendar Integration"
              ]
            })
          }}
        />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${rubik.variable} antialiased`}
      >
        <UserAuthSessionProvider>
        <Toaster position="top-right" />
          <HeroUIThemeProvider>
            <main>{children}</main>
          </HeroUIThemeProvider>
        </UserAuthSessionProvider>
      </body>
    </html>
  );
}
