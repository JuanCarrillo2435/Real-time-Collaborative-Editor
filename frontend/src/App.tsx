import React, { useState } from 'react';
import CollaborativeEditor from './components/Editor';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [user, setUser] = useState<{ name: string; id: string } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setUser({
        name: inputValue.trim(),
        id: Math.random().toString(36).substring(7),
      });
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 relative">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-6 relative z-10"
          >
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Join Workspace</h1>
              <p className="text-sm text-gray-500">Pick a name to enter the collaborative session</p>
            </div>
            
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Your display name..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                Enter Document
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex flex-col pt-0 sm:pt-4"
          >
            {/* The CollaborativeEditor now encapsulates the entire full-screen workspace UI */}
            <CollaborativeEditor currentUser={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
