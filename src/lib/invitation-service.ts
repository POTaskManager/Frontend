import { ProjectInvitation } from '@/types';

const API_BASE = '/api/proxy/api/projects';

export const invitationService = {
  async getMyInvitations(): Promise<ProjectInvitation[]> {
    const res = await fetch(`${API_BASE}/invitations/my`, {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch invitations');
    }

    return res.json();
  },

  async acceptInvitation(token: string): Promise<{ status: string; invitation: ProjectInvitation; message: string }> {
    const res = await fetch(`${API_BASE}/invitations/accept/${token}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Failed to accept invitation');
    }

    return res.json();
  },

  async rejectInvitation(projectId: string, email: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${projectId}/invitations/${email}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Failed to reject invitation');
    }
  },
};
