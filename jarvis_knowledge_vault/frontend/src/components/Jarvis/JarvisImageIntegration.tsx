'use client';
import React, { useState } from 'react';

export default function JarvisImageIntegration() {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<{message: string, action?: string, data?: any} | null>(null);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsProcessing(true);
    setResponse(null);

    // Mock natural language parsing for Image Vault commands
    setTimeout(() => {
      const lower = command.toLowerCase();
      
      if (lower.includes('save') && lower.includes('image')) {
        let purpose = 'General';
        if (lower.includes('under wallpaper')) purpose = 'Wallpaper';
        if (lower.includes('under ui')) purpose = 'UI Design';

        setResponse({
          message: `I've prepared the image to be saved under ${purpose}. Confirm upload?`,
          action: 'SAVE_CONFIRMATION',
          data: { purpose }
        });
      } else if (lower.includes('delete') && lower.includes('image')) {
        setResponse({
          message: 'Are you sure you want to delete this image? This action cannot be undone.',
          action: 'DELETE_CONFIRMATION'
        });
      } else if (lower.includes('find') || lower.includes('show')) {
        setResponse({
          message: 'Filtering your Image Vault based on your request...',
          action: 'FILTER'
        });
      } else {
        setResponse({
          message: "I'm not sure how to handle that image command yet. Try asking me to save, delete, or find images."
        });
      }
      
      setIsProcessing(false);
      setCommand('');
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 max-w-sm w-full">
      
      {/* Response/Confirmation Card */}
      {response && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-2xl w-full text-white animate-in slide-in-from-bottom-5">
          <div className="flex gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </div>
            <p className="text-sm leading-relaxed pt-1">{response.message}</p>
          </div>

          {/* Action Buttons based on response type */}
          {response.action === 'SAVE_CONFIRMATION' && (
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-white text-black py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors">Accept</button>
              <button className="flex-1 bg-neutral-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors">Modify</button>
              <button className="flex-1 bg-transparent border border-neutral-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors" onClick={() => setResponse(null)}>Cancel</button>
            </div>
          )}

          {response.action === 'DELETE_CONFIRMATION' && (
            <div className="flex gap-2 mt-4">
              <button className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">Delete</button>
              <button className="flex-1 bg-neutral-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors" onClick={() => setResponse(null)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Input Field */}
      <form onSubmit={handleCommand} className="relative w-full">
        <input 
          type="text" 
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Ask Jarvis to manage your images..." 
          className="w-full bg-[#0a0a0a] border border-neutral-800 text-white px-4 py-3 pr-12 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xl backdrop-blur-md"
          disabled={isProcessing}
        />
        <button 
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
          disabled={isProcessing || !command.trim()}
        >
          {isProcessing ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          )}
        </button>
      </form>
    </div>
  );
}
