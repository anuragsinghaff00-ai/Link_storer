'use client';
import React from 'react';

interface ImageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: any; // In a real app, use proper typing
}

export default function ImageDetailsModal({ isOpen, onClose, image }: ImageDetailsModalProps) {
  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative flex flex-col md:flex-row w-full max-w-6xl max-h-[90vh] bg-[#0f0f0f] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        {/* Left Side: Image Preview */}
        <div className="w-full md:w-2/3 bg-black flex items-center justify-center relative group min-h-[300px]">
          <img 
            src={image.storage_path} 
            alt={image.title} 
            className="max-w-full max-h-[90vh] object-contain"
          />
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Download
            </button>
          </div>
        </div>

        {/* Right Side: Metadata & Details */}
        <div className="w-full md:w-1/3 flex flex-col h-full max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0f0f0f]">
          <div className="p-6 flex flex-col gap-6">
            
            {/* Header Info */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">{image.title}</h2>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-xs font-medium">
                  {image.purpose}
                </span>
                <span className="text-sm text-neutral-500">{new Date(image.dateAdded).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-6 border-b border-neutral-800">
              <button className="flex-1 py-2 bg-neutral-900 border border-neutral-800 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                Favorite
              </button>
              <button className="flex-1 py-2 bg-neutral-900 border border-neutral-800 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
                Pin
              </button>
              <button className="px-3 py-2 bg-neutral-900 border border-neutral-800 text-white rounded-lg hover:bg-neutral-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
            </div>

            {/* Description & AI Analysis */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {image.description || "A detailed dark-themed developer dashboard showcasing analytics, server status, and recent deployments."}
                </p>
              </div>

              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-indigo-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <h3 className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
                  AI Analysis
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Visual Style</span>
                    <span className="text-neutral-200">Dark Mode, Modern UI</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500">Key Objects</span>
                    <span className="text-neutral-200">Charts, Sidebar, Data Tables</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag: string) => (
                  <span key={tag} className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded-md">
                    #{tag}
                  </span>
                ))}
                <button className="px-2.5 py-1 bg-transparent border border-dashed border-neutral-700 text-neutral-500 hover:text-white hover:border-neutral-500 text-xs rounded-md transition-all">
                  + Add Tag
                </button>
              </div>
            </div>

            {/* Sources */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Sources</h3>
              <div className="flex flex-col gap-2">
                <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-800 rounded flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">GitHub Design Repo</div>
                      <div className="text-xs text-neutral-500">github.com</div>
                    </div>
                  </div>
                  <div className="text-neutral-500 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                  </div>
                </a>
              </div>
            </div>

            {/* File Info */}
            <div className="mt-auto pt-6 border-t border-neutral-800 text-xs text-neutral-500 flex justify-between">
              <span>1920 × 1080 • 2.4 MB • JPG</span>
              <button className="text-red-400 hover:text-red-300 transition-colors">Delete Image</button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
