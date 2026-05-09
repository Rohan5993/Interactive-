import React, { useEffect, useState, useMemo } from 'react';
import { useProjectStore, Scene, Interaction } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, CheckCircle2, X, Mic, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function Player() {
  const { currentProject, scenes, interactions, playbackTime, isPlaying, setIsPlaying, setPlaybackTime } = useProjectStore();
  const [activeInteraction, setActiveInteraction] = useState<Interaction | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean, text: string } | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [audioStartedFor, setAudioStartedFor] = useState<string | null>(null);

  const updateVoiceOffset = async (offset: number) => {
    if (!currentScene?.scene.id || !currentProject?.id) return;
    try {
      await updateDoc(doc(db, 'projects', currentProject.id, 'scenes', currentScene.scene.id), {
        voiceOffset: Math.max(0, Math.min(offset, currentScene.scene.duration))
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'scenes');
    }
  };

  // Determine current scene
  const currentScene = useMemo(() => {
    let accumulated = 0;
    for (const scene of scenes) {
      if (playbackTime < accumulated + scene.duration) {
        return { scene, relativeTime: playbackTime - accumulated };
      }
      accumulated += scene.duration;
    }
    return null;
  }, [scenes, playbackTime]);

  // Voiceover Logic
  useEffect(() => {
    let isCancelled = false;
    
    if (isPlaying && currentScene && !activeInteraction) {
      const waitTime = currentScene.scene.voiceOffset || 0;
      
      // Trigger audio if we haven't started it for this specific scene entry AND we are past the offset
      if (audioStartedFor !== currentScene.scene.id && 
          currentScene.relativeTime >= waitTime && 
          currentScene.scene.voicePrompt) {
        
        setAudioStartedFor(currentScene.scene.id);
        
        if (currentScene.scene.audioUrl) {
          const audio = new Audio(currentScene.scene.audioUrl);
          audio.play().catch(e => {
            if (!isCancelled) console.error("Audio play failed", e);
          });
        } else {
          window.speechSynthesis.cancel();
          const uttr = new SpeechSynthesisUtterance(currentScene.scene.voicePrompt);
          uttr.rate = 1.05;
          window.speechSynthesis.speak(uttr);
        }
      }
    } else if (!isPlaying) {
       window.speechSynthesis.cancel();
       setAudioStartedFor(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [currentScene?.scene.id, isPlaying, !!activeInteraction, currentScene?.relativeTime]);

  // Check for interactions
  useEffect(() => {
    const inter = interactions.find(i => 
      Math.abs(i.timestamp - playbackTime) < 0.15 && 
      activeInteraction?.id !== i.id
    );
    
    if (inter && isPlaying) {
      setIsPlaying(false);
      setActiveInteraction(inter);
      setFeedback(null);
      setFillValue('');
      window.speechSynthesis.cancel(); // Stop talking when interaction appears
    }
  }, [playbackTime, interactions, isPlaying, activeInteraction?.id]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(playbackTime + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackTime]);

  const handleAnswer = (option: string) => {
    if (!activeInteraction) return;
    if (activeInteraction.type === 'POLL') {
      setFeedback({ correct: true, text: 'Thank you for your response!' });
      return;
    }
    const isCorrect = option.toLowerCase().trim() === activeInteraction.correctAnswer.toLowerCase().trim();
    setFeedback({
      correct: isCorrect,
      text: isCorrect ? 'Correct! Well done.' : `Oops! The correct answer was "${activeInteraction.correctAnswer}".`
    });
  };

  const resume = () => {
    setActiveInteraction(null);
    setFeedback(null);
    setPlaybackTime(playbackTime + 0.2); // Skip the trigger point
    setIsPlaying(true);
  };

  return (
    <div className="w-full h-full relative group">
       {/* Video Canvas (Simulated with background image) */}
       <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-neutral-950">
          <AnimatePresence mode="wait">
            {currentScene ? (
              <motion.div 
                key={currentScene.scene.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 overflow-hidden"
              >
                 <motion.div
                    key={`visual-${currentScene.scene.id}`}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-full h-full"
                 >
                    {currentScene.scene.videoUrl?.includes('.mp4') ? (
                      <video 
                        src={currentScene.scene.videoUrl} 
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : currentScene.scene.videoUrl ? (
                      <img 
                       src={currentScene.scene.videoUrl} 
                       alt="scene" 
                       className="w-full h-full object-cover opacity-90" 
                       referrerPolicy="no-referrer"
                      />
                    ) : (
                      <img 
                        src={`https://loremflickr.com/1920/1080/${encodeURIComponent(currentScene.scene.videoPrompt?.split(' ').slice(0, 2).join(',') || 'cinematic,visual')}`} 
                        alt="scene fallback" 
                        className="w-full h-full object-cover opacity-80 mix-blend-luminosity" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1920";
                        }}
                      />
                    )}
                 </motion.div>
                 
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-12 space-y-6 z-10">
                   <motion.div
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     className="px-3 py-1 bg-brand-500/20 text-brand-500 text-[10px] rounded-full font-bold uppercase tracking-widest inline-block border border-brand-500/20"
                   >
                     Scene: {currentScene.scene.title}
                   </motion.div>
                   <p className="text-3xl font-display font-medium text-neutral-100 italic drop-shadow-lg hidden">
                     "{currentScene.scene.videoPrompt || 'No visual prompt defined'}"
                   </p>
                   <div className="h-1 w-64 bg-neutral-800 rounded-full mx-auto relative group/timeline">
                     <motion.div 
                       className="absolute inset-y-0 left-0 bg-brand-500 rounded-full"
                       initial={false}
                       animate={{ width: `${(currentScene.relativeTime / currentScene.scene.duration) * 100}%` }}
                     />
                     
                     {currentScene.scene.voicePrompt && (
                       <motion.div
                         drag="x"
                         dragConstraints={{ left: 0, right: 256 }}
                         dragElastic={0}
                         dragMomentum={false}
                         onDragEnd={(_: any, info: any) => {
                           // info.point.x is page relative
                           // We need it relative to the 256px container
                           const rect = (document.querySelector('.group\\/timeline') as HTMLElement).getBoundingClientRect();
                           const x = info.point.x - rect.left;
                           const percent = Math.max(0, Math.min(x / rect.width, 1));
                           updateVoiceOffset(percent * currentScene.scene.duration);
                         }}
                         className="absolute top-0 -translate-y-full -translate-x-1/2 cursor-grab active:cursor-grabbing group/mic z-[60]"
                         style={{ left: `${((currentScene.scene.voiceOffset || 0) / currentScene.scene.duration) * 100}%` }}
                       >
                          <div className="flex flex-col items-center">
                            <div className="px-2 py-1 bg-brand-500 text-white text-[8px] font-black rounded shadow-lg flex items-center gap-1 transition-transform group-hover/mic:scale-110">
                              <Mic size={8} />
                              START
                            </div>
                            <div className="w-0.5 h-4 bg-brand-500" />
                          </div>
                       </motion.div>
                     )}
                   </div>
                 </div>
              </motion.div>
            ) : (
              <div className="text-neutral-700 flex flex-col items-center gap-4">
                 <Play size={48} className="opacity-20" />
                 <p>No scenes found. Add a scene to start.</p>
              </div>
            )}
          </AnimatePresence>
       </div>

       {/* Interaction Overlay */}
       <AnimatePresence>
         {activeInteraction && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
            >
              <motion.div 
                initial={{ y: 20, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl"
              >
                {!feedback ? (
                  <div className="space-y-6 text-left">
                    <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center mb-4">
                      <MessageSquare className="text-white" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold">{activeInteraction.question}</h2>
                    
                    {/* Render inputs based on type */}
                    {activeInteraction.type === 'MCQ' || activeInteraction.type === 'TRUE_FALSE' || activeInteraction.type === 'POLL' ? (
                       <div className="grid grid-cols-1 gap-3">
                          {activeInteraction.options.map((opt, i) => (
                             <button 
                               key={i}
                               onClick={() => handleAnswer(opt)}
                               className="w-full text-left p-4 rounded-xl border border-neutral-800 hover:border-brand-500 hover:bg-brand-500/5 transition-all font-medium"
                             >
                               {opt}
                             </button>
                          ))}
                       </div>
                     ) : activeInteraction.type === 'FILL_BLANKS' ? (
                      <div className="space-y-4">
                        <input 
                          type="text"
                          autoFocus
                          value={fillValue}
                          onChange={(e) => setFillValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAnswer(fillValue)}
                          placeholder="Type your answer..."
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 font-mono"
                        />
                        <button 
                          onClick={() => handleAnswer(fillValue)}
                          className="w-full py-3 bg-brand-500 text-white font-bold rounded-xl active:scale-95 transition-transform"
                        >
                          Submit Answer
                        </button>
                      </div>
                    ) : activeInteraction.type === 'DRAG_DROP' ? (
                      <div className="space-y-6">
                        <p className="text-sm text-neutral-400 italic">Drag the correct option to the target area:</p>
                        <div className="flex flex-wrap gap-3">
                           {activeInteraction.options.map((opt, i) => (
                             <motion.button
                               key={i}
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => handleAnswer(opt)}
                               className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm cursor-grab active:cursor-grabbing"
                             >
                               {opt}
                             </motion.button>
                           ))}
                        </div>
                        <div className="h-20 border-2 border-dashed border-brand-500/30 rounded-2xl flex items-center justify-center text-neutral-600 text-sm">
                           Drop target area
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className={cn(
                      "w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4",
                      feedback.correct ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    )}>
                      {feedback.correct ? <CheckCircle2 size={32} /> : <X size={32} />}
                    </div>
                    <h2 className="text-2xl font-bold">{feedback.correct ? 'Brilliant!' : 'Try Again'}</h2>
                    <p className="text-neutral-400">{feedback.text}</p>
                    <button 
                      onClick={resume}
                      className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      {activeInteraction.type === 'POLL' ? 'Back to Video' : (feedback.correct ? 'Continue Video' : 'Retry')}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
         )}
       </AnimatePresence>

       {/* Subtitles Overlay */}
       {currentScene && currentScene.scene.voicePrompt && !activeInteraction && (
         <div className="absolute bottom-12 left-12 right-12 text-center pointer-events-none z-20">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/60 px-4 py-1.5 rounded-lg text-lg font-medium backdrop-blur-sm border border-white/10 shadow-lg"
            >
              {currentScene.scene.voicePrompt}
            </motion.span>
         </div>
       )}
    </div>
  );
}
