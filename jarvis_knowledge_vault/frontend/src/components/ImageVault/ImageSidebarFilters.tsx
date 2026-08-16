import React from 'react';

export default function ImageSidebarFilters() {
  const purposes = [
    'Wallpaper', 'UI Design', 'Backend Inspiration', 'AI', 'Machine Learning', 
    'System Design', 'Project Inspiration'
  ];

  const categories = [
    'Architecture', 'Dashboards', 'Mobile Apps', 'Landing Pages', 'Diagrams'
  ];

  return (
    <div className="h-full bg-[#0a0a0a] p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      {/* Brand/Logo Area */}
      <div className="flex items-center gap-3 text-white">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
        <span className="font-semibold tracking-wide">Image Vault</span>
      </div>

      {/* Quick Filters */}
      <div className="space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-white bg-neutral-900 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          All Images
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          Favorites
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
          Pinned
        </button>
      </div>

      {/* Purposes */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Purpose</h3>
          <button className="text-neutral-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
        <div className="space-y-1">
          {purposes.map(purpose => (
            <button key={purpose} className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-lg transition-colors group">
              <span className="truncate pr-2">{purpose}</span>
              <span className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-600 group-hover:text-neutral-400 transition-colors">12</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</h3>
          <button className="text-neutral-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
        <div className="space-y-1">
          {categories.map(category => (
            <button key={category} className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-900/50 rounded-lg transition-colors group">
              <span className="truncate pr-2">{category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
