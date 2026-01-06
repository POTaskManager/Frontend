'use client';

import { useProjectStore } from '@/store/project-store';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InvitationList } from '@/components/invitations/InvitationList';
import { invitationService } from '@/lib/invitation-service';
import { ProjectInvitation } from '@/types';

export default function DashboardPage() {
  const { projects, projectsLoading, fetchProjects, createProject } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchInvitations();
  }, [fetchProjects]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const data = await invitationService.getMyInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setInvitationsLoading(false);
    }
  };
  
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    setIsCreating(true);
    const project = await createProject(newProjectName, newProjectDescription);
    setIsCreating(false);
    
    if (project) {
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
    }
  };

  // Placeholder for future features
  const myTasks: never[] = [];
  const notifications: never[] = [];
  const activity: never[] = [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          + New Project
        </button>
      </div>
      
      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-semibold">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label htmlFor="projectName" className="mb-1 block text-sm font-medium">
                  Project Name *
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter project name"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label htmlFor="projectDescription" className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="projectDescription"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter project description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Invitations Section */}
      {!invitationsLoading && invitations.length > 0 && (
        <section className="mt-6 rounded border p-4 bg-blue-50 dark:bg-blue-900/20">
          <h2 className="font-medium text-lg mb-4">Pending Invitations</h2>
          <InvitationList 
            invitations={invitations} 
            onInvitationUpdated={() => {
              fetchInvitations();
              fetchProjects();
            }} 
          />
        </section>
      )}
      
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded border p-4">
          <h2 className="font-medium">Projects</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {projectsLoading ? (
              <li className="text-muted-fg">Loading projects...</li>
            ) : projects.length === 0 ? (
              <li className="text-muted-fg">No projects</li>
            ) : (
              projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}/board` as Route} className="text-primary hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="font-medium">My Tasks</h2>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {(myTasks ?? []).length === 0 && <li>No tasks</li>}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="font-medium">Notifications</h2>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {(notifications ?? []).length === 0 && <li>All caught up</li>}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="font-medium">Recent Activity</h2>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {(activity ?? []).length === 0 && <li>No activity</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}


