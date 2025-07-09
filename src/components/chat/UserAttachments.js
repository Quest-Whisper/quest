"use client";

import React from "react";
import { DocumentIcon } from "@heroicons/react/24/outline";

export default function UserAttachments({ attachments }) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <div key={index} className="relative">
          {attachment.type.startsWith('image/') ? (
            <img
              src={attachment.url}
              className="rounded-xl h-[80px] w-[80px] object-cover border border-gray-200"
              alt={attachment.displayName || "Uploaded image"}
              onError={(e) => {
                // If the image fails to load, hide it
                e.target.style.display = "none";
                console.error("Failed to load image:", attachment.url);
              }}
            />
          ) : (
            <div className="rounded-xl h-[80px] w-[80px] bg-gray-100 border border-gray-200 flex flex-col items-center justify-center p-2">
              <DocumentIcon className="w-6 h-6 text-gray-500 mb-1" />
              <span className="text-xs text-gray-600 text-center truncate w-full">
                {attachment.displayName}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 