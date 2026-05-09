import React from 'react';
import { Video, User, LogOut, LayoutDashboard, Plus } from 'lucide-react';
import { useProjectStore } from '../store/useStore';
import { auth, signInWithGoogle } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export function Navbar() {
  const [user] = useAuthState(auth);
  const { setProject } = useProjectStore();

  return (
    <nav className="h-16 border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setProject(null)}>
        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Video className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
          Interactive
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button 
              onClick={() => setProject(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <div className="h-8 w-px bg-neutral-800 mx-2" />
            <div className="flex items-center gap-3">
               <img src={user.photoURL || ''} alt="avatar" className="w-8 h-8 rounded-full border border-neutral-700" />
               <button onClick={() => auth.signOut()} className="text-neutral-400 hover:text-red-400 p-2 transition-colors">
                 <LogOut size={18} />
               </button>
            </div>
          </>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition-all shadow-xl"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
