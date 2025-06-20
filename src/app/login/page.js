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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4f7269]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center mb-8 space-x-[10px]">
            <span className="text-2xl font-bold text-[#4f7269]">Quest</span>
            <span className="text-2xl font-normal">Whisper</span>
          </div>

          <h2 className="text-4xl font-bold mb-2">Hello!</h2>
          <p className="text-gray-600 mb-8">Sign in to continue your journey</p>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <a href="#" className="text-sm text-[#4f7269] hover:underline">
                Learn about our privacy terms?
              </a>
            </div>

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

          <p className="mt-6 text-center text-sm text-gray-500">
            Having trouble getting started?{" "}
            <a href="#" className="text-[#4f7269] hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Image with Text Overlay */}
      <div className="hidden lg:block w-1/2 relative bg-gray-100">
        <Image
          src="https://images.unsplash.com/photo-1473081556163-2a17de81fc97?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Decorative plant on wooden stand"
          layout="fill"
          objectFit="cover"
          priority
        />

        <div className="flex bg-black h-[100vh] w-[100%] p-[50px] justify-center items-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 max-w-[720px]">
            <div className="left-12 right-12 p-8 bg-white/80 backdrop-blur-sm rounded-xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Precision medicine is the new gold standard for cancer treatment
              </h3>
              <p className="text-gray-600">
                The resulting interactive report includes updated information
                about approved or investigational treatments for each patient.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
