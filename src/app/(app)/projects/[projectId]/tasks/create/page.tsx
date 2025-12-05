'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { DatePicker } from '@/components/ui/date-picker';

interface TaskFormData {
  title: string;
  description: string;
  priority: number | null;
  due_at: string | null;
  assigned_to: string | null;
  label_ids: string[];
  estimate: number | null;
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

export default function CreateTaskPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: null,
    due_at: null,
    assigned_to: null,
    label_ids: [],
    estimate: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch labels
  const { data: labelsData, isLoading: labelsLoading } = useQuery<{ labels: Label[] }>({
    queryKey: ['labels', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/labels`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch labels');
      return res.json();
    }
  });

  // Fetch members
  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: ProjectMember[] }>({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    }
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
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
      toast.success('Task created');
      queryClient.invalidateQueries({ queryKey: ['board', 'tasks', projectId] });
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title cannot exceed 255 characters';
    }

    // Due date validation
    if (formData.due_at) {
      const dueDate = new Date(formData.due_at);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (dueDate < now) {
        newErrors.due_at = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    createTask.mutate(formData);
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">New Task</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">
            Title <span className="text-danger">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) {
                setErrors({ ...errors, title: '' });
              }
            }}
            maxLength={255}
            required
            className={errors.title ? 'border-danger' : ''}
          />
          {errors.title && <p className="mt-1 text-sm text-danger">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            placeholder="Optional task description..."
          />
        </div>

        {/* Priority */}
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            value={formData.priority?.toString() || ''}
            onValueChange={(val) => setFormData({ ...formData, priority: val ? parseInt(val) : null })}
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
            value={formData.due_at}
            onChange={(date) => {
              setFormData({ ...formData, due_at: date });
              if (errors.due_at) {
                setErrors({ ...errors, due_at: '' });
              }
            }}
            minDate={new Date()}
          />
          {errors.due_at && <p className="mt-1 text-sm text-danger">{errors.due_at}</p>}
        </div>

        {/* Assigned to */}
        <div>
          <Label htmlFor="assigned_to">Assign to</Label>
          <Select
            id="assigned_to"
            value={formData.assigned_to || ''}
            onValueChange={(val) => setFormData({ ...formData, assigned_to: val || null })}
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

        {/* Labels */}
        <div>
          <Label htmlFor="labels">Labels</Label>
          <MultiSelect
            options={labelsData?.labels || []}
            value={formData.label_ids}
            onChange={(ids) => setFormData({ ...formData, label_ids: ids })}
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
            value={formData.estimate || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimate: e.target.value ? parseFloat(e.target.value) : null
              })
            }
            placeholder="0"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
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

