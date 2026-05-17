import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WorkspaceState {
  currentWorkspaceId: string | null;
  setCurrentWorkspace: (workspaceId: string) => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentWorkspaceId: null,
      setCurrentWorkspace: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
      clear: () => set({ currentWorkspaceId: null }),
    }),
    {
      name: 'teamflow.workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ currentWorkspaceId: s.currentWorkspaceId }),
    },
  ),
);
