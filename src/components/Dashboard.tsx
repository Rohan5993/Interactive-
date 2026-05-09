import React, { useEffect, useState } from 'react';
import { Plus, Video, Clock, MessageSquare, ChevronRight, Search, Trash2 } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useProjectStore, Project } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function Dashboard() {
  const [user] = useAuthState(auth);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { setProject } = useProjectStore();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, [user]);

  const createNewProject = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        title: 'Untitled Video',
        description: 'New interactive video project',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'draft'
      });
      console.log('Project created:', docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const deleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    console.log("Attempting to delete project:", projectId);
    if (!confirm('Are you sure you want to delete this project? This will remove the project and all its settings.')) return;
    
    try {
      const docRef = doc(db, 'projects', projectId);
      await deleteDoc(docRef);
      console.log("Project deleted successfully:", projectId);
    } catch (error) {
      console.error("Delete failed for project:", projectId, error);
      alert("Failed to delete project. You might not have permission or there was a connection error.");
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome, {user?.displayName?.split(' ')[0]}!</h1>
          <p className="text-neutral-500">Pick up where you left off or start a new project.</p>
        </div>
        <button 
          onClick={createNewProject}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95"
        >
          <Plus size={20} />
          Create New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {projects.map((proj) => (
            <motion.div
              key={proj.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setProject(proj)}
              className="group relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-brand-500/50 transition-all cursor-pointer"
            >
              <div className="aspect-video bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-800/50 transition-colors">
                {proj.thumbnail ? (
                  <img src={proj.thumbnail} alt={proj.title} className="w-full h-full object-cover" />
                ) : (
                  <Video className="w-12 h-12 text-neutral-700 group-hover:text-brand-500 transition-colors" />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className="text-lg font-semibold group-hover:text-brand-500 transition-colors line-clamp-1">{proj.title}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold shrink-0",
                    proj.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-brand-500/10 text-brand-500"
                  )}>
                    {proj.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 line-clamp-1 mb-4">{proj.description || 'No description'}</p>
                <div className="flex items-end justify-between text-xs text-neutral-500">
                  <span className="flex items-center gap-1 mb-2">
                    <Clock size={12} />
                    {new Date(proj.createdAt?.seconds * 1000).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2 relative z-50">
                    <button 
                      onClick={(e) => deleteProject(e, proj.id)}
                      className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
                      title="Delete Project"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="p-2 text-neutral-700 bg-neutral-800/50 rounded-lg border border-neutral-800 group-hover:border-brand-500/30 transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
