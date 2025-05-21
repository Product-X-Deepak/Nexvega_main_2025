
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BrainCircuit, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  model?: string;
}

export default function ChatAssistant({ model = 'gpt-3.5-turbo' }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isAdmin } = useAuth();

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const newMessage: ChatMessage = { role: 'user', content: inputValue };
    setMessages([...messages, newMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // This would be replaced with actual API call to your AI backend
      setTimeout(() => {
        const response = `This is a placeholder response for the ${isAdmin() ? 'admin' : 'staff'} assistant using ${model}. In a real implementation, this would connect to your Supabase Edge Function.`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching response:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardContent className="flex flex-col h-full pt-6">
        <div className="flex-1 overflow-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                {model === 'gpt-3.5-turbo' ? (
                  <Zap className="h-6 w-6 text-primary" />
                ) : (
                  <BrainCircuit className="h-6 w-6 text-primary" />
                )}
              </div>
              <h3 className="text-xl font-medium mb-2">
                {isAdmin() ? 'Admin AI Assistant' : 'Staff AI Assistant'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Ask me anything about candidates, jobs, or how to use the ATS system.
                <br />
                I can help with searching, matching, and managing your recruitment workflow.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setInputValue("Find candidates with React experience")}
                >
                  Find React candidates
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setInputValue("Summarize the top 3 candidates for Senior Developer role")}
                >
                  Rank top candidates
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setInputValue("Create a new job posting for Senior DevOps Engineer")}
                >
                  Create job posting
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setInputValue("Help me write an email to follow up with a candidate")}
                >
                  Draft candidate email
                </Button>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                {model === 'gpt-3.5-turbo' ? (
                  <div className="flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    <span>Using GPT-3.5 Turbo for faster responses</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <BrainCircuit className="h-3 w-3 mr-1" />
                    <span>Using GPT-4o for advanced capabilities</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`px-4 py-2 rounded-lg max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
