"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error) => {
    switch (error) {
      case "AccessDenied":
        return "Access was denied. Please make sure you grant the necessary permissions.";
      case "DatabaseError":
        return "There was an error connecting to the database. Please try again later.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="font-medium text-[#4f7269] hover:text-[#3d5a52]"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 