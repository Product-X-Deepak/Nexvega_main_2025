
import MainLayout from '@/components/layout/MainLayout';
import ChatAssistant from '@/components/ChatAssistant';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatAssistantPage() {
  const { isAdmin } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Chat Assistant</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isAdmin() ? 'Admin Assistant with full system access' : 'Staff Assistant with limited access'}
          </p>
        </div>
        
        <ChatAssistant />
      </div>
    </MainLayout>
  );
}
