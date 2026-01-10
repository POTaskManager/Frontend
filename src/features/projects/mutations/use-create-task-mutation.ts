import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BackendTask, mapFromBackend } from '../types';

export type CreateTaskInput = {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  state: string; // statusId
  sprintId?: string;
  assignedTo?: string;
  dueDate?: string;
};

export function useCreateTaskMutation(projectId: string, selectedSprintId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: input.title,
          description: input.description || undefined,
          priority: input.priority,
          state: input.state,
          sprintId: input.sprintId,
          assignedTo: input.assignedTo || undefined,
          dueDate: input.dueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      const created: BackendTask = await res.json();
      return mapFromBackend(created);
    },
    onSuccess: () => {
      // Invalidate both current sprint/all tasks view and the general tasks cache
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}
