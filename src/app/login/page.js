"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/chat");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: "/chat" });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#181818]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4f7269]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative ">
      {/* Subtle background image for mobile */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src="/banner2.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          priority
          className="opacity-15"
        />
        <div className="absolute inset-0 bg-white/80"></div>
      </div>

      {/* Left side - Login Form */}
      <div className="w-full py-[100px] lg:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white dark:bg-[#181818] relative z-10">
        <div className="max-w-md text-center w-full mx-auto">
          <div className="relative w-[200px] h-[200px] mx-auto">
            <Image
              src="/whisper_logo.png"
              alt="QuestWhisper"
              fill
              className="object-contain dark:collapse"
            />

            <Image
              src="/whisper_logo_dark.png"
              alt="QuestWhisper"
              fill
              className="object-contain collapse dark:visible"
            />
          </div>

          <h2 className="text-[24px] text-slate-700 dark:text-slate-200 font-medium mb-2">
            Welcome back to
          </h2>
          <div className="flex items-center justify-center mb-[200px] space-x-[10px]">
            <span className="text-[34px] font-bold text-[#4f7269]">Quest</span>
            <span className="text-[34px] font-bold text-[#4f7269]">
              Whisper
            </span>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              className="cursor-pointer w-full mt-[50px] flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-full px-6 py-3 text-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4] transition-colors"
            >
              <Image
                src="/google.svg"
                alt="Google logo"
                width={18}
                height={18}
                className="mr-2"
              />
              Sign in with Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300 ">
            Having trouble getting started?{" "}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=support@iwhispered.com&su=QuestWhisper%20Support%20Request"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4f7269] hover:underline"
            >
              Contact support
            </a>
          </p>

          <div className="flex items-center justify-center mt-[30px]">
            <a
              href="/privacy-policy"
              className="text-sm text-[#4f7269] hover:underline"
            >
              Wanna Learn about our privacy terms?
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Image with Text Overlay */}
      <div className="hidden lg:block w-1/2 relative bg-gray-100">
        <Image
          src="/banner2.jpg"
          alt="Decorative plant on wooden stand"
          layout="fill"
          objectFit="cover"
          priority
        />

        <div className="flex bg-black h-[100vh] w-[100%] p-[50px] justify-center items-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 max-w-[720px]">
            <div className="left-12 right-12 p-8 bg-white/80 backdrop-blur-sm rounded-xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Your AI companion is ready to explore ideas with you
              </h3>
              <p className="text-gray-600">
                Experience thoughtful conversations with voice capabilities and
                personalized assistance tailored to your interests and needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
