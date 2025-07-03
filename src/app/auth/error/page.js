"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";

const errorMessages = {
  DatabaseError: {
    title: "Database Connection Error",
    description: "We're experiencing temporary issues connecting to our database. This usually resolves quickly.",
    suggestion: "Please try signing in again in a few moments."
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You don't have permission to access this application.",
    suggestion: "Please contact support if you believe this is an error."
  },
  Verification: {
    title: "Email Verification Required",
    description: "Please verify your email address before continuing.",
    suggestion: "Check your email for a verification link."
  },
  Default: {
    title: "Authentication Error",
    description: "An unexpected error occurred during authentication.",
    suggestion: "Please try signing in again."
  }
};

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    setError(errorParam || "Default");
  }, [searchParams]);

  const handleRetrySignIn = async () => {
    setIsRetrying(true);
    try {
      await signIn("google", { callbackUrl: "/chat" });
    } catch (error) {
      console.error("Error retrying sign in:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Error Message */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center mb-8 space-x-[10px]">
            <span className="text-2xl font-bold text-[#4f7269]">Quest</span>
            <span className="text-2xl font-normal">Whisper</span>
          </div>

          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold mb-2 text-center text-gray-900">
            {errorInfo.title}
          </h2>
          
          <p className="text-gray-600 mb-4 text-center">
            {errorInfo.description}
          </p>
          
          <p className="text-sm text-gray-500 mb-8 text-center">
            {errorInfo.suggestion}
          </p>

          <div className="space-y-4">
            {/* Retry Sign In Button */}
            <button
              onClick={handleRetrySignIn}
              disabled={isRetrying}
              className="w-full flex items-center justify-center bg-[#4f7269] text-white rounded-full px-6 py-3 text-md font-medium hover:bg-[#3d5a52] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4f7269] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Retrying...
                </>
              ) : (
                <>
                  <Image
                    src="/google.svg"
                    alt="Google logo"
                    width={18}
                    height={18}
                    className="mr-2"
                  />
                  Try Again with Google
                </>
              )}
            </button>

            {/* Go Home Button */}
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-full px-6 py-3 text-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Go to Homepage
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Still having trouble?{" "}
              <a 
               href="https://mail.google.com/mail/?view=cm&fs=1&to=support@iwhispered.com&su=QuestWhisper%20Support%20Request"
               target="_blank"
               rel="noopener noreferrer"
                className="text-[#4f7269] hover:underline"
              >
                Contact support
              </a>
            </p>
          </div>

          {/* Error Details for Development */}
          {process.env.NODE_ENV === "development" && error && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600 font-mono">
                Error Code: {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Image with Text Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#4f7269] to-[#3d5a52]">
        <div className="absolute inset-0 bg-black/20"></div>
        <Image
          src="/plant-decor.jpg"
          alt="Plant decoration"
          fill
          className="object-cover mix-blend-overlay"
        />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">
              We'll get you back on track
            </h3>
            <p className="text-lg opacity-90 mb-8">
              Technical hiccups happen, but we're here to help you continue your journey with Quest Whisper.
            </p>
            <div className="w-16 h-1 bg-white/30 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center mb-8 space-x-[10px]">
            <span className="text-2xl font-bold text-[#4f7269]">Quest</span>
            <span className="text-2xl font-normal">Whisper</span>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4f7269]"></div>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#4f7269] to-[#3d5a52]">
        <div className="absolute inset-0 bg-black/20"></div>
        <Image
          src="/plant-decor.jpg"
          alt="Plant decoration"
          fill
          className="object-cover mix-blend-overlay"
        />
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthErrorContent />
    </Suspense>
  );
} 