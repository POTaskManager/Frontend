import { useQuery } from '@tanstack/react-query';
import type { Sprint } from '@/types';
import { sprintsSchema } from '@/features/projects/schemas';

export function useSprintsQuery(projectId: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/sprints`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch sprints');
      const data = await res.json();
      const parsed: Sprint[] = sprintsSchema.parse(data);
      return parsed;
    },
    enabled: !!projectId,
  });
}
