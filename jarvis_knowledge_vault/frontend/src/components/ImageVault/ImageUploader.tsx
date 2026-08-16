'use client';
import React, { useState } from 'react';

export default function ImageUploader() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle files here
    console.log(e.dataTransfer.files);
  };

  return (
    <div 
      className={`relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10' 
          : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-600 hover:bg-neutral-900'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-12 h-12 mb-4 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-1">Upload Images</h3>
        <p className="text-sm text-neutral-400 mb-6 max-w-md">
          Drag and drop images here, paste from clipboard, or click to browse. You can also paste an image URL.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button className="bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors">
            Browse Files
          </button>
          <div className="flex items-center px-4 py-2 bg-neutral-800 rounded-lg border border-neutral-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 mr-2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <input 
              type="text" 
              placeholder="Paste image URL..." 
              className="bg-transparent border-none focus:outline-none text-sm text-white placeholder-neutral-500 w-48"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
