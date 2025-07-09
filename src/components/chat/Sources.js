"use client";

import { useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import SourcesDrawer from './SourcesDrawer';

export default function Sources({ sources, isStreaming }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!sources || sources.length === 0 || isStreaming) return null;

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full"
      >
        <DocumentTextIcon className="w-4 h-4" />
        <span>View {sources.length} Sources</span>
      </button>

      <SourcesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sources={sources}
      />
    </>
  );
} 