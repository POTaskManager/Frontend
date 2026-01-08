import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BackendTask, mapFromBackend } from '../types';

export function useUpdateTaskMutation(projectId: string, selectedSprintId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, statusId }: { taskId: string; statusId: string }) => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ statusId }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated: BackendTask = await res.json();
      return mapFromBackend(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, selectedSprintId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}
