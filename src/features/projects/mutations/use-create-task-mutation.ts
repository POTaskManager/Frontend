import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BackendTask, mapFromBackend } from '../types';
import { useAuthStore } from '@/store/auth-store';

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  state: string;
  sprintId: string;
  boardId: string;
  assigneeId?: string;
  dueDate?: string;
};

export function useCreateTaskMutation(projectId: string, selectedSprintId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: projectId,
          boardId: input.boardId,
          title: input.title,
          description: input.description || undefined,
          priority: input.priority,
          state: input.state,
          sprintId: input.sprintId,
          assignedTo: input.assigneeId || undefined,
          createdBy: user?.id || 'user-1',
          dueDate: input.dueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      const created: BackendTask = await res.json();
      return mapFromBackend(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, selectedSprintId] });
    },
  });
}
