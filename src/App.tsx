import React from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { useProjectStore } from './store/useStore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Video, Brain, Zap } from 'lucide-react';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const { currentProject } = useProjectStore();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-6">
        <div className="w-16 h-16 relative">
           <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full" />
           <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-neutral-500 font-mono tracking-widest uppercase text-xs">Initializing System...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-brand-500/40"
           >
             <Video size={32} />
           </motion.div>
           
           <motion.h1 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.1 }}
             className="text-6xl md:text-8xl font-display font-black mb-8 leading-[0.9]"
           >
             Create <span className="text-brand-500">Interactive</span> <br />
             AI Videos.
           </motion.h1>
           
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="max-w-2xl text-xl text-neutral-400 mb-12"
           >
             The world's first AI-powered platform for scene-based educational videos 
             with integrated assessments, voice synthesis, and cinematic storytelling.
           </motion.p>
           
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="flex flex-col sm:flex-row gap-4"
           >
             <button 
               onClick={signInWithGoogle}
               className="px-8 py-4 bg-white text-black font-bold rounded-2xl text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl"
             >
               Start Creating Now
             </button>
             <button className="px-8 py-4 bg-neutral-900 text-white font-bold rounded-2xl text-lg border border-neutral-800 hover:bg-neutral-800 transition-all">
               Watch Demo
             </button>
           </motion.div>

           <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <FeatureCard 
                icon={<Brain className="text-brand-500" />}
                title="AI Narrative"
                description="Generate scripts, prompts, and voiceovers instantly using advanced LLMs."
              />
              <FeatureCard 
                icon={<Zap className="text-brand-500" />}
                title="Interactive Layers"
                description="Pause the learning mid-stream with MCQs, polls, and drag-and-drop tasks."
              />
              <FeatureCard 
                icon={<Sparkles className="text-brand-500" />}
                title="Cinematic Quality"
                description="Scene-by-scene editing with complete control over duration and visual style."
              />
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto custom-scrollbar">
        <AnimatePresence mode="wait">
           {currentProject ? (
             <motion.div 
               key="editor"
               initial={{ opacity: 0, scale: 1.05 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="h-full"
             >
               <Editor />
             </motion.div>
           ) : (
             <motion.div 
               key="dashboard"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
             >
               <Dashboard />
             </motion.div>
           )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl text-left hover:border-brand-500/30 transition-colors group">
       <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-500/10 transition-colors">
          {icon}
       </div>
       <h3 className="text-xl font-bold mb-3">{title}</h3>
       <p className="text-neutral-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
