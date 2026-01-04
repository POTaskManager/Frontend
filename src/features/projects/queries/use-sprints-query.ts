import { useQuery } from '@tanstack/react-query';
import type { Sprint } from '@/types';
import { sprintsSchema } from '@/features/projects/schemas';
import { useMswReady } from '@/components/msw-provider';

const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

function getApiUrl(path: string) {
  return isDevelopment ? `/api${path}` : `/api/proxy/api${path}`;
}

export function useSprintsQuery(projectId: string) {
  const isMswReady = useMswReady();
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/projects/${projectId}/sprints`), {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch sprints');
      const data = await res.json();
      console.log('Fetched sprints data:', data);
      const parsed: Sprint[] = sprintsSchema.parse(data);
      return parsed;
    },
    enabled: !!projectId && (isMswReady || !isDevelopment),
  });
}
