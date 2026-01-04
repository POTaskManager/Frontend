'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { DatePicker } from '@/components/ui/date-picker';
import { getApiUrl } from '@/utils/api';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigned_to: z.string().optional(),
  sprint_id: z.string().optional(),
  due_date: z.string().nullable(),
  labels: z.array(z.string()),
  estimate: z.number().min(0).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  projectId: string;
  mode?: 'modal' | 'page';
  onSuccess?: (task: any) => void;
  onCancel?: () => void;
}

interface Label {
  label_id: string;
  name: string;
  color?: string;
  project_id: string;
}

interface ProjectMember {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
}

interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
}

export function TaskForm({ projectId, mode = 'modal', onSuccess, onCancel }: TaskFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPreview, setIsPreview] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      assigned_to: '',
      sprint_id: '',
      due_date: null,
      labels: [],
      estimate: undefined,
    }
  });

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(`task-draft-${projectId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [projectId, form]);

  // Auto-save draft
  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem(`task-draft-${projectId}`, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [projectId, form]);

  // Fetch labels
  const { data: labelsData } = useQuery<{ labels: Label[] }>({
    queryKey: ['labels', projectId],
    queryFn: () => fetch(getApiUrl(`/projects/${projectId}/labels`), { credentials: 'include' }).then(r => r.json()),
  });

  // Fetch members
  const { data: membersData } = useQuery<{ members: ProjectMember[] }>({
    queryKey: ['members', projectId],
    queryFn: () => fetch(getApiUrl(`/projects/${projectId}/members`), { credentials: 'include' }).then(r => r.json()),
  });

  // Fetch sprints
  const { data: sprintsData } = useQuery<{ sprints: Sprint[] }>({
    queryKey: ['sprints', projectId],
    queryFn: () => fetch(getApiUrl(`/projects/${projectId}/sprints`), { credentials: 'include' }).then(r => r.json()).then(sprints => ({ sprints })),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) =>
      fetch(getApiUrl(`/projects/${projectId}/tasks`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to create task');
        return r.json();
      }),
    onSuccess: (task) => {
      // Clear draft
      localStorage.removeItem(`task-draft-${projectId}`);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['board', 'tasks', projectId] });
      toast.success('Task created');
      onSuccess?.(task);
      if (mode === 'page') {
        router.push(`/projects/${projectId}/board`);
      }
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (mode === 'page') {
          form.handleSubmit(onSubmit)();
        }
      }
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, mode, onCancel]);

  if (isPreview) {
    const data = form.getValues();
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="border rounded p-4 space-y-2">
          <h4 className="font-medium">{data.title || 'Untitled'}</h4>
          <p className="text-sm text-gray-600">{data.description || 'No description'}</p>
          <div className="text-xs text-gray-500">
            Priority: {data.priority} | Estimate: {data.estimate}h
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsPreview(false)}>Edit</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={createTaskMutation.isPending}>
            {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...form.register('title')}
          className={form.formState.errors.title ? 'border-red-500' : ''}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={form.watch('priority')}
          onValueChange={(val) => form.setValue('priority', val as any)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="assigned_to">Assign to</Label>
        <Select
          value={form.watch('assigned_to')}
          onValueChange={(val) => form.setValue('assigned_to', val)}
        >
          <option value="">Unassigned</option>
          {membersData?.members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.display_name} ({member.email})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="sprint_id">Sprint</Label>
        <Select
          value={form.watch('sprint_id')}
          onValueChange={(val) => form.setValue('sprint_id', val)}
        >
          <option value="">No Sprint</option>
          {sprintsData?.sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="due_date">Due Date</Label>
        <DatePicker
          value={form.watch('due_date')}
          onChange={(date) => form.setValue('due_date', date)}
          minDate={new Date()}
        />
      </div>

      <div>
        <Label htmlFor="labels">Labels</Label>
        <MultiSelect
          options={labelsData?.labels || []}
          value={form.watch('labels')}
          onChange={(ids) => form.setValue('labels', ids)}
          getOptionLabel={(label) => label.name}
          getOptionValue={(label) => label.label_id}
        />
      </div>

      <div>
        <Label htmlFor="estimate">Estimate (SP)</Label>
        <Input
          id="estimate"
          type="number"
          min="0"
          step="0.5"
          {...form.register('estimate', { valueAsNumber: true })}
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setIsPreview(!isPreview)}>
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button type="submit" disabled={createTaskMutation.isPending}>
            {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </div>
    </form>
  );
}