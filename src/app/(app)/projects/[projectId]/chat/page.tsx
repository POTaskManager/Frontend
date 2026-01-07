import { ChatContainer } from '@/components/chat/ChatContainer';

interface ChatPageProps {
  params: {
    projectId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatContainer projectId={params.projectId} />
    </div>
  );
}
