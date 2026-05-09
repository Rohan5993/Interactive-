import React, { useRef, useEffect } from 'react';
import { useProjectStore, Scene, Interaction } from '../store/useStore';
import { Plus, Scissors, Layers, MessageSquare } from 'lucide-react';
import { collection, addDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Timeline() {
  const { 
    currentProject, scenes, interactions, 
    playbackTime, setPlaybackTime, 
    selectedId, setSelectedId 
  } = useProjectStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 0), 0);
  const pxPerSec = 20;

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(totalDuration, x / pxPerSec));
    setPlaybackTime(time);
  };

  const addScene = async () => {
    if (!currentProject) return;
    try {
      await addDoc(collection(doc(db, 'projects', currentProject.id), 'scenes'), {
        title: 'New Scene',
        projectId: currentProject.id,
        order: scenes.length,
        duration: 5,
        videoPrompt: '',
        voicePrompt: '',
        style: 'Realistic'
      } as Partial<Scene>);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'scenes');
    }
  };

  const addInteraction = async () => {
    if (!currentProject) return;
    try {
      await addDoc(collection(doc(db, 'projects', currentProject.id), 'interactions'), {
        projectId: currentProject.id,
        type: 'MCQ',
        question: 'New Question',
        timestamp: playbackTime,
        options: ['Option A', 'Option B'],
        correctAnswer: 'Option A'
      } as Partial<Interaction>);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'interactions');
    }
  };

  return (
    <div className="flex flex-col h-full select-none">
      <div className="h-10 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-900/50">
        <div className="flex items-center gap-4">
          <button onClick={addScene} className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors">
            <Plus size={14} /> ADD SCENE
          </button>
          <button onClick={addInteraction} className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-colors">
            <MessageSquare size={14} /> ADD INTERACTION
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500">
            <span>TOTAL: {totalDuration.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        onClick={handleTimelineClick}
        className="flex-1 relative overflow-x-auto custom-scrollbar flex flex-col p-4"
        style={{ minWidth: '100%' }}
      >
        <div className="relative h-full" style={{ width: Math.max(1000, totalDuration * pxPerSec) }}>
          {/* Time Rulers */}
          <div className="flex h-6 border-b border-neutral-800 mb-4 pointer-events-none">
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 border-l border-neutral-800 text-[10px] font-mono pl-1 text-neutral-600" style={{ width: pxPerSec }}>
                {i % 5 === 0 ? `${i}s` : ''}
              </div>
            ))}
          </div>

          {/* Scenes Track */}
          <div className="flex gap-1 h-20 mb-4 bg-neutral-900/30 rounded-xl border border-neutral-800/50 p-1">
             {scenes.map((scene, idx) => (
                <div
                  key={scene.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(scene.id); }}
                  className={cn(
                    "relative h-full rounded-lg border transition-all cursor-pointer flex flex-col justify-end p-2",
                    selectedId === scene.id ? "bg-brand-500/20 border-brand-500" : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-500"
                  )}
                  style={{ width: (scene.duration || 0) * pxPerSec }}
                >
                  <span className="text-[10px] font-bold text-neutral-300 truncate">{scene.title}</span>
                  <div className="absolute top-1 left-1 px-1 bg-black/40 rounded text-[8px] font-mono text-neutral-500">
                    S{idx+1}
                  </div>
                </div>
             ))}
          </div>

          {/* Interactions Track */}
          <div className="h-12 relative bg-neutral-900/30 rounded-xl border border-neutral-800/50">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                onClick={(e) => { e.stopPropagation(); setSelectedId(interaction.id); }}
                className={cn(
                  "absolute h-8 w-8 top-2 -ml-4 flex items-center justify-center rounded-full border transition-all cursor-pointer shadow-lg",
                  selectedId === interaction.id ? "bg-brand-500 border-white text-white z-20 scale-110" : "bg-neutral-800 border-neutral-600 text-neutral-400 hover:border-brand-500 hover:text-brand-500"
                )}
                style={{ left: interaction.timestamp * pxPerSec }}
              >
                <MessageSquare size={14} />
              </div>
            ))}
          </div>

          {/* Playhead */}
          <motion.div 
            animate={{ x: playbackTime * pxPerSec }}
            transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
            className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
