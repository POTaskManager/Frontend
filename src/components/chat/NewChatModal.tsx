'use client';

import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';

interface ProjectMember {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
}

interface NewChatModalProps {
  projectId: string;
  onClose: () => void;
}

export function NewChatModal({ projectId, onClose }: NewChatModalProps) {
  const [chatName, setChatName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { createChat } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Fetch project members
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/proxy/api/projects/${projectId}/members`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch members');
        const data = await res.json();
        // Filter out current user from the members list
        const filteredMembers = user?.id 
          ? data.filter((member: ProjectMember) => member.userId !== user.id)
          : data;
        setMembers(filteredMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [projectId, user?.id]);

  const handleToggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    if (!chatName.trim()) {
      alert('Please enter a chat name');
      return;
    }

    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    setIsCreating(true);
    try {
      // Automatically include current user in participantIds
      const participantIds = [...selectedMembers];
      if (!participantIds.includes(user.id)) {
        participantIds.push(user.id);
      }

      await createChat(projectId, chatName, participantIds);
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold">Create New Chat</h2>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading members...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Chat Name */}
            <div className="mb-4">
              <label htmlFor="chatName" className="mb-1 block text-sm font-medium">
                Chat Name <span className="text-red-500">*</span>
              </label>
              <input
                id="chatName"
                type="text"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Enter chat name"
              />
            </div>

            {/* Member Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Select Members <span className="text-red-500">*</span>
              </label>
              <div className="max-h-48 overflow-y-auto rounded border border-gray-300 dark:border-gray-600">
                {members.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No members available
                  </div>
                ) : (
                  members.map((member) => (
                    <label
                      key={member.userId}
                      className="flex cursor-pointer items-center border-b p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.userId)}
                        onChange={() => handleToggleMember(member.userId)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{member.userName}</div>
                        <div className="text-xs text-gray-500">{member.userEmail}</div>
                      </div>
                      <span className="text-xs text-gray-400">{member.role}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || selectedMembers.length === 0}
                className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Chat'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
