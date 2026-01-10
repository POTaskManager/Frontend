import { Project } from '@/types';
import { create } from 'zustand';

export type BackendProject = Project;

interface ProjectState {
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  projectsLoading: false,
  projectsError: null,

  fetchProjects: async () => {
    set({ projectsLoading: true, projectsError: null });
    try {
      const res = await fetch('/api/projects', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const projects: BackendProject[] = await res.json();
      set({ projects, projectsLoading: false });
    } catch (e: any) {
      set({
        projectsError: e?.message || 'Error fetching projects',
        projectsLoading: false,
      });
    }
  },

  createProject: async (name: string, description?: string) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const project: Project = await res.json();
      set((state) => ({ projects: [...state.projects, project] }));
      return project;
    } catch (e: any) {
      set({ projectsError: e?.message || 'Error creating project' });
      return null;
    }
  },
}));
