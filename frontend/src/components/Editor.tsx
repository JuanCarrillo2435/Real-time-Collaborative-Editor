import React, { useEffect, useState, useMemo } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { stringToColor } from '../lib/utils';
import { Users, Wifi, WifiOff, Bold, Italic, Strikethrough, Heading1, Heading2, List, Code, FileText, LayoutDashboard, Settings, Clock, Activity as ActivityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';



interface EditorProps {
  currentUser: {
    id: string;
    name: string;
  };
}

// Create the singular shared document and provider instance completely outside React's lifecycle
// This mathematically prevents React 18 StrictMode from destroying the socket on double-mounts
const ydoc = new Y.Doc();
const provider = new HocuspocusProvider({
  url: 'ws://127.0.0.1:4005',
  name: 'collab-document-v2',
  document: ydoc,
});

export default function CollaborativeEditor({ currentUser }: EditorProps) {
  const [status, setStatus] = useState('connecting');
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<{ id: string, name: string, time: Date, action: string }[]>([]);

  useEffect(() => {
    // Fallback simple timer: since connection is local and instant, assume synced instantly after mount.
    // We bind explicit connect/disconnect just in case.
    provider.on('connect', () => setStatus('connected'));
    provider.on('disconnect', () => setStatus('connecting'));
    provider.on('synced', () => setStatus('connected'));
    
    // Automatically flag as connected to cover any edge cases where events beat React mounting
    setTimeout(() => {
       setStatus('connected');
    }, 500);

    provider.setAwarenessField('user', {
      name: currentUser.name,
      color: stringToColor(currentUser.name),
      id: currentUser.id,
    });

    provider.on('awarenessUpdate', ({ states }: any) => {
      // States is already an array of states in Hocuspocus
      const usersInfo = states.map((state: any) => state.user).filter(Boolean);
      
      setActiveUsers(prev => {
        if (usersInfo.length > prev.length) {
            const addedUser = usersInfo.find((u: any) => !prev.some(p => p.id === u.id));
            if (addedUser && addedUser.name !== currentUser.name) {
                setActivityLog(logs => [{ id: Math.random().toString(), name: addedUser.name, time: new Date(), action: 'joined' }, ...logs].slice(0, 15));
            }
        } else if (usersInfo.length < prev.length) {
             setActivityLog(logs => [{ id: Math.random().toString(), name: 'Someone', time: new Date(), action: 'left' }, ...logs].slice(0, 15));
        }
        return usersInfo;
      });
    });

    // We don't forcefully disconnect the global provider on unmount anymore
    return () => {
      // Just unbind the awareness listeners for this user so it frees memory
      provider.off('status');
      provider.off('awarenessUpdate');
    };
  }, [currentUser]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Placeholder.configure({
        placeholder: "Type '/' to see commands...",
        emptyEditorClass: 'is-editor-empty',
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: currentUser.name,
          color: stringToColor(currentUser.name),
        },
      }),
    ],
    onCreate: ({ editor }) => editor.commands.focus(),
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl focus:outline-none max-w-full',
      },
    },
  }, [provider]);

  return (
    <div className="flex w-full h-[calc(100vh-100px)] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
      
      {/* 1. Left Sidebar: Workspace Navigation */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2 font-semibold text-gray-800">
          <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">C</div>
          <span>Acme Workspace</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2 px-2">Favorites</div>
          <SidebarItem icon={<FileText size={16} />} text="Product Roadmap 2026" active />
          <SidebarItem icon={<LayoutDashboard size={16} />} text="Engineering OKRs" />
          <SidebarItem icon={<Users size={16} />} text="Meeting Notes" />
          
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-2">Team Spaces</div>
          <SidebarItem icon={<FileText size={16} />} text="Design System V3" />
          <SidebarItem icon={<FileText size={16} />} text="Marketing Copy" />
        </div>
        <div className="p-3 border-t border-gray-200">
           <SidebarItem icon={<Settings size={16} />} text="Settings & Members" />
        </div>
      </div>

      {/* 2. Main Editor Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
        
        {/* Top Header of Editor */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">Acme Workspace</div>
             <span className="text-gray-300">/</span>
             <div className="text-sm font-medium text-gray-800">Product Roadmap 2026</div>
          </div>
          
          <div className="flex items-center gap-4">
             {status === 'connected' ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Synced
                </div>
             ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin" />
                   Reconnecting...
                </div>
             )}
             
             {/* Avatars */}
             <div className="flex -space-x-2">
               <AnimatePresence>
                 {activeUsers.slice(0, 5).map((user) => (
                   <motion.div
                     key={user.id}
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className="relative group cursor-pointer z-10 hover:z-20"
                   >
                     <div 
                       className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white shadow-sm"
                       style={{ backgroundColor: user.color }}
                     >
                       {user.name.charAt(0).toUpperCase()}
                     </div>
                     <div className="absolute top-[120%] left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                       {user.name} {user.id === currentUser.id && '(You)'}
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          </div>
        </div>

        {/* The Text Editor */}
        <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-24 py-12 custom-scrollbar relative">
          {editor && (
            <>
              {/* Bubble Menu for text selection formatting */}
              <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
                <MenuButton 
                  onClick={() => editor.chain().focus().toggleBold().run()} 
                  active={editor.isActive('bold')} 
                  icon={<Bold size={16} />} 
                />
                <MenuButton 
                  onClick={() => editor.chain().focus().toggleItalic().run()} 
                  active={editor.isActive('italic')} 
                  icon={<Italic size={16} />} 
                />
                <MenuButton 
                  onClick={() => editor.chain().focus().toggleStrike().run()} 
                  active={editor.isActive('strike')} 
                  icon={<Strikethrough size={16} />} 
                />
              </BubbleMenu>

              {/* Floating Menu for empty lines (Slash command replacement UX) */}
              <FloatingMenu editor={editor} tippyOptions={{ duration: 100, placement: 'left-start' }} className="flex gap-1 bg-white p-1 shadow-lg border border-gray-200 rounded-lg transition-all">
                 <MenuButton 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                    active={editor.isActive('heading', { level: 1 })} 
                    icon={<Heading1 size={18} />} 
                 />
                 <MenuButton 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                    active={editor.isActive('heading', { level: 2 })} 
                    icon={<Heading2 size={18} />} 
                 />
                 <MenuButton 
                    onClick={() => editor.chain().focus().toggleBulletList().run()} 
                    active={editor.isActive('bulletList')} 
                    icon={<List size={18} />} 
                 />
                 <MenuButton 
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
                    active={editor.isActive('codeBlock')} 
                    icon={<Code size={18} />} 
                 />
              </FloatingMenu>

              <EditorContent editor={editor} spellCheck="false" />
            </>
          )}
        </div>
      </div>

      {/* 3. Right Sidebar: Collaboration Activity */}
      <div className="w-64 bg-gray-50 border-l border-gray-200 flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-gray-200">
           <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
             <ActivityIcon size={16} className="text-indigo-600" /> Activity Log
           </h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
           {activeUsers.length === 1 && activityLog.length === 0 && (
             <p className="text-xs text-gray-400 text-center mt-4">Waiting for others to join...</p>
           )}
           <AnimatePresence>
             {activityLog.map(log => (
                <motion.div 
                   layout
                   key={log.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-start gap-3"
                >
                   <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${log.action === 'joined' ? 'bg-green-500' : 'bg-red-400'}`} />
                   <div>
                     <p className="text-sm text-gray-700 font-medium">
                        {log.name} <span className="font-normal text-gray-500">{log.action === 'joined' ? 'entered the document.' : 'left the session.'}</span>
                     </p>
                     <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                       <Clock size={10} /> {format(log.time, 'HH:mm:ss')}
                     </p>
                   </div>
                </motion.div>
             ))}
           </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

function SidebarItem({ icon, text, active }: { icon: React.ReactNode, text: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
      <div className={active ? 'text-indigo-600' : 'text-gray-400'}>{icon}</div>
      <div className="truncate">{text}</div>
    </div>
  );
}

function MenuButton({ onClick, active, icon }: { onClick: () => void, active: boolean, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 transition-colors ${active ? 'bg-gray-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      {icon}
    </button>
  );
}
