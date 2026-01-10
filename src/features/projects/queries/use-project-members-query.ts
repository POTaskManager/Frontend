import { useQuery } from '@tanstack/react-query';

export type ProjectMember = {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
};

export function useProjectMembersQuery(projectId: string) {
  return useQuery<ProjectMember[]>({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch project members');
      }
      
      return res.json();
    },
    enabled: !!projectId,
  });
}
