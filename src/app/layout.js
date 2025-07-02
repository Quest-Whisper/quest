import { Rubik } from "next/font/google";
import "./globals.css";
import UserAuthSessionProvider from "@/providers/UserAuthSessionProvider";
import HeroUIThemeProvider from "@/providers/HeroUIThemeProvider";
import { Toaster } from 'react-hot-toast';


const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quest Whisper - Your AI Companion",
  description: "Experience thoughtful conversations with voice capabilities and personalized assistance. Manage Google Workspace, search the web, and get real-time information through natural voice commands.",
  keywords: "AI assistant, voice commands, Google Workspace, AI companion, artificial intelligence, voice AI, productivity",
  authors: [{ name: "QuestWhisper Team" }],
  creator: "QuestWhisper",
  publisher: "QuestWhisper",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quest--questwhisper-caf40.us-central1.hosted.app',
    siteName: 'QuestWhisper',
    title: 'QuestWhisper - Your AI Companion',
    description: 'Experience thoughtful conversations with voice capabilities and personalized assistance. Manage Google Workspace, search the web, and get real-time information through natural voice commands.',
    images: [
      {
        url: '/api/og-image',
        width: 1200,
        height: 630,
        alt: 'QuestWhisper - Your AI Companion',
        type: 'image/png',
      },
      {
        url: '/banner2.jpg',
        width: 1200,
        height: 630,
        alt: 'QuestWhisper - Your AI Companion',
        type: 'image/jpeg',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@questwhisper',
    creator: '@questwhisper',
    title: 'QuestWhisper - Your AI Companion',
    description: 'Experience thoughtful conversations with voice capabilities and personalized assistance.',
    images: ['/api/og-image'],
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
  metadataBase: new URL('https://quest--questwhisper-caf40.us-central1.hosted.app'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
