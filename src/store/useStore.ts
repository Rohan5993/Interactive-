import { create } from 'zustand';

export interface Scene {
  id: string;
  projectId: string;
  title: string;
  videoPrompt: string;
  voicePrompt: string;
  voiceId: string;
  duration: number;
  order: number;
  backgroundMusic?: string;
  subtitles?: string;
  style?: string;
  videoUrl?: string;
  audioUrl?: string;
  voiceOffset?: number;
}

export interface Interaction {
  id: string;
  projectId: string;
  type: 'MCQ' | 'DRAG_DROP' | 'FILL_BLANKS' | 'TRUE_FALSE' | 'POLL';
  question: string;
  options: string[];
  correctAnswer: string;
  timestamp: number;
  feedback?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: any;
  updatedAt: any;
  status: 'draft' | 'processing' | 'completed';
  thumbnail?: string;
}

interface ProjectState {
  currentProject: Project | null;
  scenes: Scene[];
  interactions: Interaction[];
  playbackTime: number;
  isPlaying: boolean;
  selectedId: string | null; // ID of scene or interaction being edited
  
  setProject: (project: Project | null) => void;
  setScenes: (scenes: Scene[]) => void;
  setInteractions: (interactions: Interaction[]) => void;
  setPlaybackTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSelectedId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  scenes: [],
  interactions: [],
  playbackTime: 0,
  isPlaying: false,
  selectedId: null,
  
  setProject: (project) => set({ currentProject: project }),
  setScenes: (scenes) => set({ scenes: scenes.sort((a,b) => a.order - b.order) }),
  setInteractions: (interactions) => set({ interactions }),
  setPlaybackTime: (time) => set({ playbackTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSelectedId: (id) => set({ selectedId: id }),
}));
