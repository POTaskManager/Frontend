import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BackendTask, mapFromBackend, Task } from '../types';

const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

function getApiUrl(path: string) {
  return isDevelopment ? `/api${path}` : `/api/proxy/api${path}`;
}

export function useUpdateTaskMutation(projectId: string, selectedSprintId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, state }: { taskId: string; state: Task['status'] }) => {
      const res = await fetch(getApiUrl(`/projects/${projectId}/tasks/${taskId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: state }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated: BackendTask = await res.json();
      return mapFromBackend(updated);
    },
    onMutate: async ({ taskId, state }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId, selectedSprintId] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks', projectId, selectedSprintId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['tasks', projectId, selectedSprintId], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map(task => 
          task.id === taskId ? { ...task, status: state } : task
        );
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId, selectedSprintId], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, selectedSprintId] });
    },
  });
}
