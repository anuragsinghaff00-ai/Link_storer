import React from 'react';
import ImageSidebarFilters from '@/components/ImageVault/ImageSidebarFilters';
import ImageUploader from '@/components/ImageVault/ImageUploader';
import ImageCard from '@/components/ImageVault/ImageCard';
import JarvisImageIntegration from '@/components/Jarvis/JarvisImageIntegration';

export default function ImageVaultPage() {
  // Mock data for initial rendering
  const images = [
    {
      id: '1',
      title: 'Dark Dashboard Inspiration',
      purpose: 'UI Design',
      tags: ['dashboard', 'dark-mode'],
      dateAdded: '2026-08-16',
      storage_path: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    },
    {
      id: '2',
      title: 'System Architecture',
      purpose: 'Backend',
      tags: ['diagram', 'aws'],
      dateAdded: '2026-08-15',
      storage_path: 'https://images.unsplash.com/photo-1667372393086-9d4001d4d650?q=80&w=1932&auto=format&fit=crop',
    },
    {
      id: '3',
      title: 'Aesthetic Wallpaper',
      purpose: 'Wallpaper',
      tags: ['nature', 'mountains'],
      dateAdded: '2026-08-14',
      storage_path: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop',
    }
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-neutral-800 hidden md:block shrink-0">
        <ImageSidebarFilters />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
          <h1 className="text-xl font-medium tracking-tight">Image Vault</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search images, text, tags..." 
                className="bg-neutral-900 border border-neutral-800 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-700 w-64 transition-all"
              />
            </div>
            <button className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors">
              + Add Image
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <ImageUploader />
          </div>

          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {images.map(image => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>
        </div>
        
        {/* Jarvis Integration */}
        <JarvisImageIntegration />
      </div>
    </div>
  );
}
