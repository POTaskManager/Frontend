import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BackendTask, mapFromBackend } from '../types';

export type UpdateTaskInput = {
  taskId: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  state?: string;
  assignedTo?: string;
  dueDate?: string;
};

export function useUpdateTaskMutation(projectId: string, selectedSprintId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { taskId, state, ...updateData } = input;
      const body = {
        ...updateData,
        ...(state ? { status: state } : {}),
      };
      const res = await fetch(`/api/proxy/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated: BackendTask = await res.json();
      return mapFromBackend(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, selectedSprintId] });
    },
  });
}
