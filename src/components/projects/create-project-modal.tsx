'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { getApiUrl } from '@/utils/api';

interface TeamMember {
  email: string;
  role: 'member' | 'tester' | 'client';
}

interface CreateProjectData {
  name: string;
  description?: string;
  members: TeamMember[];
}

interface InvitationResult {
  email: string;
  success: boolean;
  error?: string;
}

interface CreateProjectResponse {
  project: {
    id: string;
    name: string;
    createdAt: string;
  };
  invitations: InvitationResult[];
}

export function CreateProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    members: []
  });
  const [bulkEmails, setBulkEmails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [memberErrors, setMemberErrors] = useState<Record<number, string>>({});

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const res = await fetch(getApiUrl('/projects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

      if (status === 201) {
        toast.success('Project created successfully');
        router.push(`/projects/${data.project.id}/board`);
        handleClose();
      } else if (status === 207) {
        // Partial success
        const successCount = data.invitations.filter((inv) => inv.success).length;
        const errorCount = data.invitations.filter((inv) => !inv.success).length;

        if (successCount > 0) {
          toast.success(`Project created. ${successCount} invitation(s) sent successfully.`);
        }

        if (errorCount > 0) {
          const errorMessages = data.invitations
            .filter((inv) => !inv.success)
            .map((inv) => `${inv.email}: ${inv.error}`)
            .join('\n');
          toast.error(`${errorCount} invitation(s) failed:\n${errorMessages}`, { duration: 5000 });
        }

        router.push(`/projects/${data.project.id}/board`);
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
    setStep(1);
    setFormData({ name: '', description: '', members: [] });
    setBulkEmails('');
    setErrors({});
    setMemberErrors({});
    onClose();
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Project name cannot exceed 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newMemberErrors: Record<number, string> = {};

    if (formData.members.length === 0) {
      newErrors.members = 'At least one team member is required';
    } else if (formData.members.length > 50) {
      newErrors.members = 'Maximum 50 team members allowed';
    }

    // Validate each member
    formData.members.forEach((member, index) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        newMemberErrors[index] = 'Invalid email format';
      }
    });

    // Check for duplicates
    const emails = formData.members.map((m) => m.email.toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicates.length > 0) {
      duplicates.forEach((email) => {
        const indices = emails
          .map((e, i) => (e === email ? i : -1))
          .filter((i) => i !== -1);
        indices.forEach((idx) => {
          newMemberErrors[idx] = 'Duplicate email';
        });
      });
    }

    setErrors(newErrors);
    setMemberErrors(newMemberErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newMemberErrors).length === 0;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleStep2Next = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleAddMember = () => {
    if (formData.members.length >= 50) {
      toast.error('Maximum 50 team members allowed');
      return;
    }

    setFormData({
      ...formData,
      members: [...formData.members, { email: '', role: 'member' }]
    });
  };

  const handleRemoveMember = (index: number) => {
    setFormData({
      ...formData,
      members: formData.members.filter((_, i) => i !== index)
    });
    const newErrors = { ...memberErrors };
    delete newErrors[index];
    setMemberErrors(newErrors);
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...formData.members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value } as TeamMember;
    setFormData({ ...formData, members: updatedMembers });

    // Clear error for this member
    if (memberErrors[index]) {
      const newErrors = { ...memberErrors };
      delete newErrors[index];
      setMemberErrors(newErrors);
    }
  };

  const handleBulkAdd = () => {
    const emails = bulkEmails
      .split(/[,\n;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      toast.error('No valid emails found');
      return;
    }

    if (formData.members.length + emails.length > 50) {
      toast.error('Adding these emails would exceed the maximum of 50 members');
      return;
    }

    const newMembers: TeamMember[] = emails.map((email) => ({
      email,
      role: 'member' as const
    }));

    setFormData({
      ...formData,
      members: [...formData.members, ...newMembers]
    });
    setBulkEmails('');
  };

  const handleSubmit = () => {
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    createProject.mutate(formData);
  };

  const roleDescriptions = {
    member: 'Can view and edit tasks',
    tester: 'Can view tasks and add test results',
    client: 'Can view tasks and add comments'
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project" size="lg">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full border-2',
                s === step
                  ? 'border-primary bg-primary text-primary-fg'
                  : s < step
                    ? 'border-primary bg-primary text-primary-fg'
                    : 'border-muted text-muted-fg'
              )}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 3 && (
              <div
                className={clsx('h-1 w-12', s < step ? 'bg-primary' : 'bg-muted')}
                style={{ marginLeft: '-1px', marginRight: '-1px' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
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
            <Button onClick={handleStep1Next}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 2: Team Members */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label>Team Members</Label>
            <p className="text-sm text-muted-fg mb-4">
              Add team members to your project. You can add up to 50 members.
            </p>

            {/* Bulk input */}
            <div className="mb-4">
              <Label htmlFor="bulk-emails">Add Multiple Emails (comma, semicolon, or newline separated)</Label>
              <Textarea
                id="bulk-emails"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={3}
                placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBulkAdd}
                className="mt-2"
                disabled={!bulkEmails.trim()}
              >
                Add Emails
              </Button>
            </div>

            {/* Members list */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {formData.members.map((member, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      placeholder="email@example.com"
                      className={memberErrors[index] ? 'border-danger' : ''}
                    />
                    {memberErrors[index] && (
                      <p className="mt-1 text-xs text-danger">{memberErrors[index]}</p>
                    )}
                  </div>
                  <div className="w-32">
                    <Select
                      value={member.role}
                      onValueChange={(val) => handleMemberChange(index, 'role', val)}
                    >
                      <option value="member">Member</option>
                      <option value="tester">Tester</option>
                      <option value="client">Client</option>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(index)}
                    className="text-danger"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            {errors.members && <p className="mt-2 text-sm text-danger">{errors.members}</p>}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMember}
                disabled={formData.members.length >= 50}
              >
                + Add Member
              </Button>
              <span className="text-sm text-muted-fg">
                {formData.members.length} / 50 members
              </span>
            </div>

            {/* Role descriptions */}
            <div className="mt-4 rounded border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">Role Permissions:</p>
              <ul className="text-xs space-y-1 text-muted-fg">
                {Object.entries(roleDescriptions).map(([role, desc]) => (
                  <li key={role}>
                    <strong className="text-foreground">{role}:</strong> {desc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleStep2Next}>Next</Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Project Details</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {formData.name}
              </p>
              {formData.description && (
                <p>
                  <strong>Description:</strong> {formData.description}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Team Members ({formData.members.length})</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
              {formData.members.map((member, index) => (
                <div key={index} className="flex items-center justify-between rounded border p-2">
                  <span>{member.email}</span>
                  <span className="text-muted-fg capitalize">{member.role}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={handleSubmit} disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

