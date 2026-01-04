'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { useMswReady } from '@/components/msw-provider';

const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
import { DatePicker } from '@/components/ui/date-picker';
import { getApiUrl } from '@/utils/api';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  description: z.string().optional(),
  priority: z.number().min(1).max(5).nullable(),
  due_at: z.string().nullable(),
  assigned_to: z.string().nullable().optional(),
  sprint_id: z.string().nullable().optional(),
  label_ids: z.array(z.string()),
  estimate: z.number().min(0).nullable().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

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

export default function CreateTaskPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const isMswReady = useMswReady();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: null,
      due_at: null,
      assigned_to: null,
      sprint_id: null,
      label_ids: [],
      estimate: null,
    }
  });

  const [isPreview, setIsPreview] = useState(false);

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

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const data = form.getValues();
      localStorage.setItem(`task-draft-${projectId}`, JSON.stringify(data));
    }, 30000);
    return () => clearInterval(interval);
  }, [projectId, form]);

  // Fetch labels
  const { data: labelsData, isLoading: labelsLoading } = useQuery<{ labels: Label[] }>({
    queryKey: ['labels-create', projectId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/projects/${projectId}/labels`), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json();
    }
  });

  // Fetch members
  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: ProjectMember[] }>({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/projects/${projectId}/members`), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    }
  });

  // Fetch sprints
  const { data: sprintsData, isLoading: sprintsLoading } = useQuery<{ sprints: Sprint[] }>({
    queryKey: ['sprints-create', projectId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/projects/${projectId}/sprints`), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch sprints');
      const data = await res.json();
      return { sprints: data };
    },
    enabled: !!projectId && (isMswReady || !isDevelopment),
  });

  // Set default sprint when sprints are loaded
  useEffect(() => {
    if (sprintsData?.sprints && sprintsData.sprints.length > 0 && !form.getValues('sprint_id')) {
      const firstSprint = sprintsData.sprints[0];
      if (firstSprint) {
        form.setValue('sprint_id', firstSprint.id);
      }
    }
  }, [sprintsData, form]);

  console.log('sprintsData:', sprintsData, 'sprintsLoading:', sprintsLoading);

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await fetch(getApiUrl(`/projects/${projectId}/tasks`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create task' }));
        throw { status: res.status, message: errorData.error || 'Failed to create task' };
      }

      return res.json();
    },
    onSuccess: () => {
      // Clear draft
      localStorage.removeItem(`task-draft-${projectId}`);
      toast.success('Task created');
      queryClient.invalidateQueries({ queryKey: ['tasks'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['sprints'], exact: false });
      router.push(`/projects/${projectId}/board`);
    },
    onError: (error: { status?: number; message?: string }) => {
      if (error.status === 400 || error.status === 403) {
        toast.error(error.message || 'Failed to create task');
      } else {
        toast.error('Failed to create task');
      }
    }
  });

  const handleSubmit = (data: TaskFormData) => {
    // Validate due date
    if (data.due_at) {
      const dueDate = new Date(data.due_at);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (dueDate < now) {
        form.setError('due_at', { message: 'Due date cannot be in the past' });
        return;
      }
    }
    createTask.mutate(data);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        form.handleSubmit(handleSubmit)();
      }
      if (e.key === 'Escape') {
        router.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, router]);

  if (isPreview) {
    const data = form.getValues();
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Preview Task</h1>
        <div className="border rounded p-4 space-y-2 mb-6">
          <h2 className="font-medium text-lg">{data.title || 'Untitled'}</h2>
          <p className="text-sm text-gray-600">{data.description || 'No description'}</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Priority: {data.priority ? `Level ${data.priority}` : 'None'}</div>
            <div>Estimate: {data.estimate ? `${data.estimate}h` : 'Not set'}</div>
            {data.due_at && <div>Due: {new Date(data.due_at).toLocaleDateString()}</div>}
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsPreview(false)}>Edit</Button>
          <Button onClick={form.handleSubmit(handleSubmit)} disabled={createTask.isPending}>
            {createTask.isPending ? 'Creating...' : 'Create Task'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">New Task</h1>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">
            Title <span className="text-danger">*</span>
          </Label>
          <Input
            id="title"
            {...form.register('title')}
            maxLength={255}
            className={form.formState.errors.title ? 'border-danger' : ''}
          />
          {form.formState.errors.title && <p className="mt-1 text-sm text-danger">{form.formState.errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            rows={5}
            placeholder="Optional task description..."
          />
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            value={form.watch('priority')?.toString() || ''}
            onValueChange={(val) => form.setValue('priority', val ? parseInt(val) : null)}
          >
            <option value="">None</option>
            <option value="1">1 - Lowest</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Critical</option>
          </Select>
        </div>

        {/* Due date */}
        <div>
          <Label htmlFor="due_at">Due Date</Label>
          <DatePicker
            value={form.watch('due_at') || null}
            onChange={(date) => form.setValue('due_at', date)}
            minDate={new Date()}
          />
          {form.formState.errors.due_at && <p className="mt-1 text-sm text-danger">{form.formState.errors.due_at.message}</p>}
        </div>

        {/* Assigned to */}
        <div>
          <Label htmlFor="assigned_to">Assign to</Label>
          <Select
            id="assigned_to"
            value={form.watch('assigned_to') || ''}
            onValueChange={(val) => form.setValue('assigned_to', val || null)}
            disabled={membersLoading}
          >
            <option value="">Unassigned</option>
            {membersData?.members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name} ({member.email})
              </option>
            ))}
          </Select>
        </div>

        {/* Sprint */}
        <div>
          <Label htmlFor="sprint_id">Sprint</Label>
          <Select
            id="sprint_id"
            value={form.watch('sprint_id') || ''}
            onValueChange={(val) => form.setValue('sprint_id', val || null)}
            disabled={sprintsLoading}
          >
            <option value="">No Sprint</option>
            {sprintsData?.sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Labels */}
        <div>
          <Label htmlFor="labels">Labels</Label>
          <MultiSelect
            options={labelsData?.labels || []}
            value={form.watch('label_ids')}
            onChange={(ids) => form.setValue('label_ids', ids)}
            getOptionLabel={(label) => label.name}
            getOptionValue={(label) => label.label_id}
            placeholder={labelsLoading ? 'Loading...' : 'Select labels...'}
          />
        </div>

        {/* Estimate */}
        <div>
          <Label htmlFor="estimate">Estimate (h)</Label>
          <Input
            id="estimate"
            type="number"
            min="0"
            step="0.5"
            {...form.register('estimate', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => setIsPreview(!isPreview)}>
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? 'Saving...' : 'Create Task'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createTask.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

