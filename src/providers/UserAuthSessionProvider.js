"use client";

import { SessionProvider } from "next-auth/react";

export default function UserAuthSessionProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
