import React, { useEffect, useState } from 'react';
import { useProjectStore, Scene, Interaction } from '../store/useStore';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChevronLeft, Play, Pause, Save, Share2, Sparkles, Wand2, Settings } from 'lucide-react';
import { Timeline } from './Timeline';
import { ScenePanel } from './ScenePanel';
import { InteractionPanel } from './InteractionPanel';
import { Player } from './Player';
import { cn } from '../lib/utils';

export function Editor() {
  const { currentProject, setProject, setScenes, setInteractions, selectedId, playbackTime, isPlaying, setIsPlaying } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'scene' | 'interaction'>('scene');

  useEffect(() => {
    if (!currentProject) return;

    const scenesQuery = query(
      collection(doc(db, 'projects', currentProject.id), 'scenes'),
      orderBy('order', 'asc')
    );
    const scenesUnsub = onSnapshot(scenesQuery, (snapshot) => {
      setScenes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scene)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'scenes'));

    const interactionsQuery = query(
      collection(doc(db, 'projects', currentProject.id), 'interactions'),
      orderBy('timestamp', 'asc')
    );
    const interactionsUnsub = onSnapshot(interactionsQuery, (snapshot) => {
      setInteractions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interaction)));
    }, error => handleFirestoreError(error, OperationType.LIST, 'interactions'));

    return () => {
      scenesUnsub();
      interactionsUnsub();
    };
  }, [currentProject]);

  if (!currentProject) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-black">
      {/* Editor Header */}
      <div className="h-14 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setProject(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-sm line-clamp-1">{currentProject.title}</h2>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Project Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors">
            <Share2 size={16} />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20">
            <Sparkles size={16} />
            Generate Scene
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Player & Preview */}
        <div className="flex-1 flex flex-col bg-neutral-950 p-6">
          <div className="flex-1 relative bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl flex items-center justify-center">
             <Player />
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-8">
             <button
               onClick={() => setIsPlaying(!isPlaying)}
               className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
             >
               {isPlaying ? <Pause fill="currentColor" /> : <Play className="ml-1" fill="currentColor" />}
             </button>
             <div className="flex flex-col items-center">
                <span className="font-mono text-xl text-neutral-200">
                  {formatTime(playbackTime)}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">Timeline Position</span>
             </div>
          </div>
        </div>

        {/* Right: Panels */}
        <div className="w-96 border-l border-neutral-800 bg-neutral-900 flex flex-col">
          <div className="flex border-b border-neutral-800">
            <button 
              onClick={() => setActiveTab('scene')}
              className={cn(
                "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                activeTab === 'scene' ? "text-brand-500 border-brand-500" : "text-neutral-500 border-transparent hover:text-neutral-300"
              )}
            >
              Scene Editor
            </button>
            <button 
              onClick={() => setActiveTab('interaction')}
              className={cn(
                "flex-1 py-3 text-sm font-semibold transition-all border-b-2",
                activeTab === 'interaction' ? "text-brand-500 border-brand-500" : "text-neutral-500 border-transparent hover:text-neutral-300"
              )}
            >
              Interactions
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'scene' ? <ScenePanel /> : <InteractionPanel />}
          </div>
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-64 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        <Timeline />
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}
