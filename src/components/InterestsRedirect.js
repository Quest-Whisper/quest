"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InterestsRedirect({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Check if user has interests set
      if (session.user.hasInterests === false || !session.user.hasInterests) {
        router.push("/interests");
        return;
      }
    }
  }, [status, session, router]);

  // If user needs to set interests, don't render children
  if (status === "authenticated" && session?.user && (session.user.hasInterests === false || !session.user.hasInterests)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4f7269]"></div>
      </div>
    );
  }

  return children;
} 