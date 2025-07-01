import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserAuthSessionProvider from "@/providers/UserAuthSessionProvider";
import HeroUIThemeProvider from "@/providers/HeroUIThemeProvider";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Quest Whisper",
  description: "Your AI Companion",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
