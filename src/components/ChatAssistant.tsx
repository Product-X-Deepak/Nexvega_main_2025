import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PaperclipIcon, SendIcon, RotateCwIcon, Cpu } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gpt-3.5-turbo' | 'gpt-4o'>('gpt-3.5-turbo');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, userRole, isAdmin } = useAuth();
  
  // Add initial welcome message when component mounts
  useEffect(() => {
    const welcomeMessage = {
      role: 'assistant' as const,
      content: isAdmin() 
        ? "Hello, I'm your AI Assistant with full system access. How can I help you today? You can ask me about managing candidates, clients, jobs, or any administrative tasks."
        : "Hello, I'm your AI Assistant with role-appropriate access. How can I help you today? You can ask me about candidate management, resume processing, or job-related tasks.",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [isAdmin]);
  
  // Auto scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to use the assistant",
        variant: "destructive",
      });
      return;
    }
    
    // Add user message to chat
    const userMessage = { role: 'user' as const, content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Prepare message history for the AI
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call the AI assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: input,
          userRole: userRole,
          userId: user.id,
          messageHistory,
          model: model // Include the selected model
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        // Add AI response to chat
        const assistantMessage = {
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Display model info
        toast({
          title: `Using ${data.model}`,
          description: "Response generated successfully",
          duration: 3000,
        });
      } else {
        throw new Error(data?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get a response from the assistant",
        variant: "destructive",
      });
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant' as const,
        content: "I'm sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    // Keep only the initial welcome message
    const welcomeMessage = {
      role: 'assistant' as const,
      content: isAdmin() 
        ? "Hello, I'm your AI Assistant with full system access. How can I help you today? You can ask me about managing candidates, clients, jobs, or any administrative tasks."
        : "Hello, I'm your AI Assistant with role-appropriate access. How can I help you today? You can ask me about candidate management, resume processing, or job-related tasks.",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    toast({
      title: "Chat cleared",
      description: "Your conversation has been reset",
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-13rem)] shadow-lg border rounded-lg">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">AI Assistant {isAdmin() ? '(Admin)' : '(Staff)'}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={(value) => setModel(value as 'gpt-3.5-turbo' | 'gpt-4o')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT 3.5 Turbo (Fast)</SelectItem>
                <SelectItem value="gpt-4o">GPT 4o (Smart)</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearChat}
              title="Clear conversation"
            >
              <RotateCwIcon size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <div className="flex flex-col">
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' 
                      ? 'text-primary-foreground/70'
                      : 'text-secondary-foreground/70'
                  }`}>
                    {formatDate(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <CardFooter className="pt-2 border-t p-3">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              title="Attach file"
              disabled={true} // File attachment functionality to be implemented later
            >
              <PaperclipIcon size={18} />
            </Button>
            <Button
              type="submit"
              size="icon"
              variant="default"
              disabled={isLoading || !input.trim()}
              title="Send message"
            >
              <SendIcon size={18} />
            </Button>
          </div>
        </form>
      </CardFooter>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2">
            <Cpu className="h-10 w-10 animate-pulse text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Processing with {model}...</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChatAssistant;
