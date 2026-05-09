import React, { useState, useEffect } from 'react';
import { useProjectStore, Scene } from '../store/useStore';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Trash2, Wand2, Type, Music, Play, Layers, Sparkles, Loader2 } from 'lucide-react';
import { generateSceneImage, generateSceneVoice, refineScenePrompt, generateSceneVideo } from '../lib/ai';

export function ScenePanel() {
  const { selectedId, scenes, currentProject } = useProjectStore();
  const scene = scenes.find(s => s.id === selectedId);
  const [localTitle, setLocalTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (scene) setLocalTitle(scene.title);
  }, [scene?.id]);

  if (!scene || !currentProject) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center opacity-50">
        <Layers className="w-12 h-12 mb-4 text-neutral-700" />
        <p className="text-sm font-medium">Select a scene from the timeline to edit</p>
      </div>
    );
  }

  const updateScene = async (updates: Partial<Scene>) => {
    try {
      await updateDoc(doc(db, 'projects', currentProject.id, 'scenes', scene.id), {
        ...updates,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'scenes');
    }
  };

  const handleAIDevelop = async () => {
    if (!scene.videoPrompt || !scene.voicePrompt) {
      alert("Please enter both visual and voice prompts first.");
      return;
    }
    setIsGenerating(true);
    try {
      const imageUrl = await generateSceneImage(scene.videoPrompt);
      const videoUrl = await generateSceneVideo(scene.videoPrompt);
      const audioUrl = await generateSceneVoice(scene.voicePrompt);
      
      await updateScene({
        videoUrl: videoUrl || imageUrl || undefined,
        audioUrl: audioUrl || undefined
      });
    } catch (e) {
      console.error(e);
      alert("Generation failed. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinePrompt = async () => {
     if (!scene.videoPrompt) return;
     const refined = await refineScenePrompt(scene.videoPrompt);
     updateScene({ videoPrompt: refined });
  };

  const deleteScene = async () => {
    if (!confirm('Are you sure you want to delete this scene?')) return;
    try {
      await deleteDoc(doc(db, 'projects', currentProject.id, 'scenes', scene.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'scenes');
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Layers size={18} className="text-brand-500" />
          Scene Settings
        </h3>
        <button onClick={deleteScene} className="p-2 text-neutral-500 hover:text-red-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block">Title</label>
          <input 
            type="text" 
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={() => updateScene({ title: localTitle })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block">Duration (s)</label>
             <input 
              type="number" 
              value={scene.duration}
              onChange={(e) => updateScene({ duration: Number(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
             <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block">Style</label>
             <select 
               value={scene.style}
               onChange={(e) => updateScene({ style: e.target.value })}
               className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors capitalize"
             >
               <option>Realistic</option>
               <option>Anime</option>
               <option>3D Animation</option>
               <option>Cyberpunk</option>
             </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block flex items-center justify-between">
            Visual Prompt
            <button 
              onClick={handleRefinePrompt}
              className="text-brand-500 hover:text-brand-400 flex items-center gap-1 transition-colors"
            >
              <Wand2 size={10} />
              AI Enhance
            </button>
          </label>
          <textarea 
            value={scene.videoPrompt}
            placeholder="Describe what should happen visually..."
            onChange={(e) => updateScene({ videoPrompt: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors min-h-[100px] resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block flex items-center justify-between">
            Voiceover Text
            <span className="text-neutral-500 text-[10px]">(Text to Speech)</span>
          </label>
          <textarea 
            value={scene.voicePrompt}
            placeholder="What should be said in this scene?"
            onChange={(e) => updateScene({ voicePrompt: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors min-h-[80px] resize-none"
          />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAIDevelop}
            disabled={isGenerating}
            className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all active:scale-95"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating Assets...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate AI Video & Voice
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-neutral-500 px-4 italic leading-tight">
            This will generate a cinematic AI video and synthesize a voiceover based on your prompts.
          </p>
        </div>

        <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-xl">
           <h4 className="text-xs font-bold text-brand-500 uppercase flex items-center gap-2 mb-3">
             <Music size={14} /> Background Music
           </h4>
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-800 rounded flex items-center justify-center">
                <Play size={12} className="text-neutral-500" />
              </div>
              <span className="text-xs text-neutral-400 font-medium">None selected</span>
              <button className="ml-auto text-[10px] font-bold text-brand-500 hover:underline">BROWSE</button>
           </div>
        </div>
      </div>
    </div>
  );
}
