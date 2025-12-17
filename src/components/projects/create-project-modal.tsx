'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth-store';

interface CreateProjectData {
  name: string;
  description?: string;
  ownerId: string;
}

type CreateProjectForm = Pick<CreateProjectData, 'name' | 'description'>

// Support both possible response shapes
// 1) { project: { id, ... } }
// 2) { id, ... }
interface CreateProjectResponseProjectWrapper {
  project: {
    id: string;
    name?: string;
    createdAt?: string;
  };
}

interface CreateProjectResponseDirectProject {
  id: string;
  name?: string;
  createdAt?: string;
}

type CreateProjectResponse = CreateProjectResponseProjectWrapper | CreateProjectResponseDirectProject;

export function CreateProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateProjectForm>({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const res = await fetch('/api/proxy/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw { status: res.status, data: responseData };
      }

      return { status: res.status, data: responseData as CreateProjectResponse };
    },
    onSuccess: ({ status, data }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      if (status === 201 || status === 200) {
        toast.success('Project created successfully');
        const projectId = (data as any).project?.id ?? (data as any).id;
        if (projectId) {
          router.push(`/projects/${projectId}/board`);
        }
        handleClose();
      }
    },
    onError: (error: { status?: number; data?: any }) => {
      if (error.status === 400) {
        toast.error(error.data?.error || 'Validation error');
      } else {
        toast.error('Failed to create project');
      }
    }
  });

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setErrors({});
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Project name cannot exceed 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!user) return;
    if (!validateForm()) return;
    createProject.mutate({
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      ownerId: user.id
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project" size="lg">
      <div className="space-y-6">
        <div>
          <Label htmlFor="name">
            Project Name <span className="text-danger">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            maxLength={255}
            required
            className={errors.name ? 'border-danger' : ''}
          />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Optional project description..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createProject.isPending}>
            {createProject.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

