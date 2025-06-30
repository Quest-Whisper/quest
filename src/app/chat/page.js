"use client";
import React, { Suspense } from "react";
import Chat from "./Chat";

function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading chat...</div>}>
      <Chat />
    </Suspense>
  );
}

export default ChatPage;
