'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Route } from 'next';

type ProjectMember = {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
};

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch project members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/members`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json() as Promise<ProjectMember[]>;
    },
    enabled: !!projectId,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to remove member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: memberEmail,
          role: memberRole 
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to add member');
      }

      setShowAddMember(false);
      setMemberEmail('');
      setMemberRole('member');
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push(`/projects/${projectId}/board` as Route)}
            className="mb-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            ← Back to Board
          </button>
          <h1 className="text-2xl font-semibold">Project Settings</h1>
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          + Add Member
        </button>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowAddMember(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-semibold">Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label htmlFor="memberEmail" className="mb-1 block text-sm font-medium">
                  Email *
                </label>
                <input
                  id="memberEmail"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter member email"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label htmlFor="memberRole" className="mb-1 block text-sm font-medium">
                  Role
                </label>
                <select
                  id="memberRole"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="member">Member - Can edit tasks and boards</option>
                  <option value="admin">Admin - Full project management</option>
                  <option value="owner">Owner - Complete control (transfer ownership)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
                  disabled={isAdding}
                >
                  {isAdding ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members List */}
      <section className="rounded border p-4 dark:border-gray-700">
        <h2 className="mb-4 font-medium">Team Members</h2>
        {isLoading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No members yet</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded border p-3 dark:border-gray-700"
              >
                <div>
                  <div className="font-medium">{member.userName || 'Unknown User'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{member.userEmail}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Role: {member.role}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${member.userName || member.userEmail} from project?`)) {
                      removeMemberMutation.mutate(member.userId);
                    }
                  }}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
