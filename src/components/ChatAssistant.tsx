
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function ChatAssistant() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Add a welcome message when component mounts
  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome',
      role: 'assistant' as const,
      content: isAdmin() ? 
        'Welcome to the Admin Assistant. I have full system access and can help you with any administrative task, including managing candidates, clients, and jobs.' : 
        'Welcome to the Staff Assistant. I can help you with candidate management, resume processing, and job postings within your permission levels.',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, [isAdmin]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to use the chat assistant.',
        variant: 'destructive'
      });
      return;
    }
    
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Prepare API call parameters
      const userRole = isAdmin() ? 'admin' : 'staff';
      const body = {
        message: message.trim(),
        userRole,
        userId: user.id,
        messageHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      };
      
      // Call the AI assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body
      });
      
      if (error) throw new Error(error.message);
      
      const botMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: data.response || 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling assistant:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the assistant. Please try again.',
        variant: 'destructive',
      });
      
      // Add error message as assistant message
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your request. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus back on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-13rem)]">
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            } mb-4`}
          >
            {msg.role === 'assistant' && (
              <Avatar className="h-8 w-8 mr-2 mt-1">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              <div className="prose dark:prose-invert prose-sm">
                {/* Simple markdown parsing for basic formatting */}
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            </div>
            {msg.role === 'user' && (
              <Avatar className="h-8 w-8 ml-2 mt-1">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <Avatar className="h-8 w-8 mr-2 mt-1">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="max-w-[80%] p-4 rounded-lg bg-muted flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI Assistant is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <CardFooter className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            ref={inputRef}
            placeholder="Ask me anything..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
