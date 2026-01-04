import { useQuery } from '@tanstack/react-query';
import { BackendTask, mapFromBackend } from '@/features/projects';
import { tasksSchema } from '@/features/projects/schemas';
import { getApiUrl } from '@/utils/api';
import { useMswReady } from '@/components/msw-provider';

const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export function useTasksQuery(projectId: string, sprintId: string | null) {
  const isMswReady = useMswReady();
  return useQuery({
    queryKey: ['tasks', projectId, sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      const res = await fetch(getApiUrl(`/projects/${projectId}/sprints/${sprintId}/tasks`), {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data: BackendTask[] = await res.json();
      const parsed: BackendTask[] = tasksSchema.parse(data);
      return parsed.map(mapFromBackend);
    },
    enabled: !!projectId && !!sprintId && (isMswReady || !isDevelopment),
  });
}
