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
  title: "Quest Whisper - Your AI Companion",
  description: "Experience thoughtful conversations with voice capabilities and personalized assistance. Manage Google Workspace, search the web, and get real-time information through natural voice commands.",
  authors: [{ name: "QuestWhisper Team" }],
  creator: "QuestWhisper",
  publisher: "QuestWhisper",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://iwhispered.com',
    siteName: 'QuestWhisper',
    title: 'QuestWhisper - Your AI Companion',
    description: 'Experience thoughtful conversations with voice capabilities and personalized assistance. Manage Google Workspace, search the web, and get real-time information through natural voice commands.',
    images: [
      {
        url: '/og_banner.png',
        width: 1200,
        height: 630,
        alt: 'QuestWhisper - Your AI Companion',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@questwhisper',
    creator: '@questwhisper',
    title: 'QuestWhisper - Your AI Companion',
    description: 'Experience thoughtful conversations with voice capabilities and personalized assistance.',
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
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="keywords" content="AI assistant, voice commands, Google Workspace, AI companion, artificial intelligence, voice AI, productivity" />
        <meta name="theme-color" content="#4f7269" />
        <link rel="icon" href="/favicon.ico" />
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
