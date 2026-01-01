import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useUpdateTaskMutation, useTasksQuery, useSprintsQuery, Task } from '@/features/projects';

export function useBoardFacade() {
  const params = useParams();
  const projectId = params.projectId as string;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read sprint ID from URL query param
  const selectedSprintId = searchParams.get('sprint');

  const {
    data: sprints = [],
    isLoading: sprintsLoading,
    error: sprintsError,
  } = useSprintsQuery(projectId);

  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useTasksQuery(projectId, selectedSprintId);

  const updateTaskMutation = useUpdateTaskMutation(projectId, selectedSprintId);

  const changeSprint = (sprintId: string) => {
    router.push(`/projects/${projectId}/board?sprint=${sprintId}`);
  };

  const updateTask = (taskId: string, state: Task['status']) => {
    updateTaskMutation.mutate({ taskId, state });
  };

  // Auto-select first sprint and update URL if no sprint is selected
  useEffect(() => {
    if (!selectedSprintId && sprints.length > 0) {
      const firstSprintId = sprints[0]?.id;
      router.replace(`/projects/${projectId}/board?sprint=${firstSprintId}`);
    }
  });
  // }, [sprints, selectedSprintId, router, projectId]);

  const isLoading = sprintsLoading || tasksLoading;
  const error = sprintsError || tasksError;

  return {
    sprints,
    tasks,
    isLoading,
    error,
    selectedSprintId,
    updateTask,
    changeSprint,
  };
}
