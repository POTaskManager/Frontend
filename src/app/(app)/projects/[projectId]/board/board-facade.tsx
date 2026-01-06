import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import {
  useUpdateTaskMutation,
  useCreateTaskMutation,
  useTasksQuery,
  useSprintsQuery,
  Task,
  CreateTaskInput,
} from '@/features/projects';
import { useQuery } from '@tanstack/react-query';

interface ProjectStatus {
  id: string;
  name: string;
  typeId: number;
  columnId: string;
  columnName: string;
  columnOrder: number;
}

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

  const { data: statuses = [] } = useQuery<ProjectStatus[]>({
    queryKey: ['statuses', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/statuses`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch statuses');
      return res.json();
    },
  });

  const updateTaskMutation = useUpdateTaskMutation(projectId, selectedSprintId);
  const createTaskMutation = useCreateTaskMutation(projectId, selectedSprintId);

  const changeSprint = (sprintId: string | null) => {
    if (sprintId) {
      router.push(`/projects/${projectId}/board?sprint=${sprintId}`);
    } else {
      router.push(`/projects/${projectId}/board`);
    }
  };

  const updateTask = (taskId: string, statusId: string) => {
    updateTaskMutation.mutate({ taskId, statusId });
  };

  const createTask = (input: CreateTaskInput) => {
    return createTaskMutation.mutateAsync(input);
  };

  // No auto-selection - show all tasks by default when no sprint is selected

  const isLoading = sprintsLoading || tasksLoading;
  const error = sprintsError || tasksError;

  return {
    sprints,
    tasks,
    statuses,
    isLoading,
    error,
    selectedSprintId,
    updateTask,
    createTask,
    changeSprint,
    // temporarily expose projectId
    projectId,
  };
}
