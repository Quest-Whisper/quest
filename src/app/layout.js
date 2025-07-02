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
