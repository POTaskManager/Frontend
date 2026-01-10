import { useQuery } from '@tanstack/react-query';
import { BackendTask, mapFromBackend } from '@/features/projects';
import { tasksSchema } from '@/features/projects/schemas';

export function useTasksQuery(projectId: string, sprintId: string | null) {
  return useQuery({
    queryKey: ['tasks', projectId, sprintId],
    queryFn: async () => {
      // Fetch all tasks when no sprint selected, otherwise fetch sprint tasks
      const url = sprintId
        ? `/api/projects/${projectId}/sprints/${sprintId}/tasks`
        : `/api/projects/${projectId}/tasks`;
      
      const res = await fetch(url, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data: BackendTask[] = await res.json();
      const parsed: BackendTask[] = tasksSchema.parse(data);
      return parsed.map(mapFromBackend);
    },
    enabled: !!projectId,
  });
}
