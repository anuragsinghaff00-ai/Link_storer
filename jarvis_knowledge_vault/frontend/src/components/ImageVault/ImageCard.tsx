import React from 'react';
import Image from 'next/image';

interface ImageCardProps {
  image: {
    id: string;
    title: string;
    purpose: string;
    tags: string[];
    dateAdded: string;
    storage_path: string;
  };
}

export default function ImageCard({ image }: ImageCardProps) {
  return (
    <div className="group relative break-inside-avoid rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/50">
      {/* Image Container */}
      <div className="relative w-full">
        {/* We use standard img for external arbitrary URLs without configuring next/image hostnames for now */}
        <img 
          src={image.storage_path} 
          alt={image.title} 
          className="w-full object-cover"
          loading="lazy"
        />
        
        {/* Overlay Actions (Visible on Hover) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
          <div className="flex justify-end gap-2">
            <button className="p-1.5 bg-black/50 backdrop-blur-md text-white rounded-md hover:bg-white/20 transition-colors" title="Pin">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
            </button>
            <button className="p-1.5 bg-black/50 backdrop-blur-md text-white rounded-md hover:bg-white/20 transition-colors" title="Favorite">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <button className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-xs font-medium rounded-md hover:bg-white/20 transition-colors">
              View Source
            </button>
            <button className="px-3 py-1 bg-white text-black text-xs font-medium rounded-md hover:bg-neutral-200 transition-colors">
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-neutral-100 truncate">{image.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-sm">{image.purpose}</span>
          <span className="text-xs text-neutral-500">{new Date(image.dateAdded).toLocaleDateString()}</span>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {image.tags.map(tag => (
            <span key={tag} className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
