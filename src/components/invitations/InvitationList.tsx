'use client';

import { useState } from 'react';
import { ProjectInvitation } from '@/types';
import { invitationService } from '@/lib/invitation-service';

interface InvitationListProps {
  invitations: ProjectInvitation[];
  onInvitationUpdated: () => void;
}

export function InvitationList({ invitations, onInvitationUpdated }: InvitationListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (invitation: ProjectInvitation) => {
    setProcessingId(invitation.id);
    try {
      await invitationService.acceptInvitation(invitation.token);
      alert(`Successfully joined ${invitation.project?.name || 'the project'}!`);
      onInvitationUpdated();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitation: ProjectInvitation) => {
    if (!confirm(`Are you sure you want to reject the invitation to ${invitation.project?.name || 'this project'}?`)) {
      return;
    }

    setProcessingId(invitation.id);
    try {
      await invitationService.rejectInvitation(invitation.projectId, invitation.email);
      alert('Invitation rejected.');
      onInvitationUpdated();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      alert('Failed to reject invitation. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pending invitations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {invitation.project?.name || invitation.projectName || 'Project Invitation'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Invited by: {invitation.inviter?.name || invitation.inviterName || invitation.inviter?.email || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Role: <span className="font-medium capitalize">{invitation.role || invitation.roleName}</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Received: {new Date(invitation.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleAccept(invitation)}
                disabled={processingId === invitation.id}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {processingId === invitation.id ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={() => handleReject(invitation)}
                disabled={processingId === invitation.id}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {processingId === invitation.id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
