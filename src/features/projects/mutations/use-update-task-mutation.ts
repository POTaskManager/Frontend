import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BackendTask, mapFromBackend, Task } from '../types';

export type UpdateTaskInput = {
  taskId: string;
  title?: string;
  description?: string;
  priority?: number; // 1-5
  statusId?: string;
  assignedTo?: string;
  dueAt?: string; // ISO date string
  sprintId?: string;
  estimate?: number;
};

export function useUpdateTaskMutation(projectId: string, selectedSprintId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { taskId, ...updateData } = input;
      // Convert empty string assignedTo to null to clear the field
      const payload = {
        ...updateData,
        assignedTo: updateData.assignedTo ? updateData.assignedTo : null,
      };
      const res = await fetch(`/api/proxy/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
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
