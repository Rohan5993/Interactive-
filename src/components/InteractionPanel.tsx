import React from 'react';
import { useProjectStore, Interaction } from '../store/useStore';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Trash2, MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function InteractionPanel() {
  const { selectedId, interactions, currentProject } = useProjectStore();
  const interaction = interactions.find(i => i.id === selectedId);

  if (!interaction || !currentProject) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center opacity-50">
        <MessageSquare className="w-12 h-12 mb-4 text-neutral-700" />
        <p className="text-sm font-medium">Select an interaction from the timeline to edit</p>
      </div>
    );
  }

  const updateInteraction = async (updates: Partial<Interaction>) => {
    try {
      await updateDoc(doc(db, 'projects', currentProject.id, 'interactions', interaction.id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'interactions');
    }
  };

  const deleteInteraction = async () => {
    if (!confirm('Delete this interaction?')) return;
    try {
      await deleteDoc(doc(db, 'projects', currentProject.id, 'interactions', interaction.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'interactions');
    }
  };

  const setOption = (idx: number, val: string) => {
    const newOps = [...interaction.options];
    newOps[idx] = val;
    updateInteraction({ options: newOps });
  };

  const removeOption = (idx: number) => {
    const newOps = interaction.options.filter((_, i) => i !== idx);
    updateInteraction({ options: newOps });
  };

  const addOption = () => {
    updateInteraction({ options: [...interaction.options, `New Option ${interaction.options.length + 1}`] });
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MessageSquare size={18} className="text-brand-500" />
          Interaction
        </h3>
        <button onClick={deleteInteraction} className="p-2 text-neutral-500 hover:text-red-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block">Type</label>
          <select 
            value={interaction.type}
            onChange={(e) => updateInteraction({ type: e.target.value as any })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="MCQ">Multiple Choice</option>
            <option value="FILL_BLANKS">Fill in Blanks</option>
            <option value="TRUE_FALSE">True/False</option>
            <option value="POLL">Poll</option>
            <option value="DRAG_DROP">Drag and Drop</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block">Question</label>
          <textarea 
            value={interaction.question}
            onChange={(e) => updateInteraction({ question: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors min-h-[80px] resize-none"
          />
        </div>

        {(interaction.type === 'MCQ' || interaction.type === 'POLL' || interaction.type === 'DRAG_DROP') && (
          <div className="space-y-3">
             <label className="text-[10px] uppercase font-bold text-neutral-500 block">
               {interaction.type === 'POLL' ? 'Poll Options' : interaction.type === 'DRAG_DROP' ? 'Options (Drag items)' : 'Options'}
             </label>
             {interaction.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                   {(interaction.type === 'MCQ' || interaction.type === 'DRAG_DROP') && (
                     <button 
                       onClick={() => updateInteraction({ correctAnswer: opt })}
                       className={cn(
                         "w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0",
                         interaction.correctAnswer === opt ? "bg-green-500 border-green-500 text-white" : "border-neutral-700 text-transparent"
                       )}
                     >
                       <CheckCircle2 size={12} />
                     </button>
                   )}
                   <input 
                     type="text" 
                     value={opt}
                     onChange={(e) => setOption(idx, e.target.value)}
                     className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                   />
                   <button onClick={() => removeOption(idx)} className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-500">
                     <Plus className="rotate-45" size={14} />
                   </button>
                </div>
             ))}
             <button 
               onClick={addOption}
               className="w-full py-2 border border-dashed border-neutral-800 rounded-lg text-xs font-bold text-neutral-500 hover:border-brand-500/50 hover:text-neutral-300 transition-all flex items-center justify-center gap-2"
              >
               <Plus size={14} /> ADD OPTION
             </button>
          </div>
        )}

        {interaction.type === 'FILL_BLANKS' && (
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-neutral-500 block">Correct Answer</label>
            <input 
              type="text" 
              value={interaction.correctAnswer}
              placeholder="The word user must type..."
              onChange={(e) => updateInteraction({ correctAnswer: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
            <p className="text-[10px] text-neutral-500">The question should contain a blank like "The capital of France is ______"</p>
          </div>
        )}

        {interaction.type === 'TRUE_FALSE' && (
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold text-neutral-500 block">Correct Choice</label>
            <div className="flex gap-2">
              {['True', 'False'].map((val) => (
                <button
                  key={val}
                  onClick={() => updateInteraction({ correctAnswer: val, options: ['True', 'False'] })}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-semibold transition-all",
                    interaction.correctAnswer === val ? "bg-brand-500 border-brand-500 text-white" : "bg-neutral-950 border-neutral-800 text-neutral-400"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
           <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1.5 block">Timestamp (s)</label>
           <input 
            type="number" 
            step="0.1"
            value={interaction.timestamp}
            onChange={(e) => updateInteraction({ timestamp: Number(e.target.value) })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
