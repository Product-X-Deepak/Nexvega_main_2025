
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Zap, Upload, X, Paperclip, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatAssistantProps {
  model?: string;
  onAction?: (action: string, data: any) => void;
}

export default function ChatAssistant({ model = 'gpt-3.5-turbo', onAction }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isProcessingResumes, setIsProcessingResumes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    // Validate file types
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(selectedFiles).forEach(file => {
      if (validTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file types",
        description: `${invalidFiles.join(', ')} ${invalidFiles.length > 1 ? 'are' : 'is'} not supported.`,
        variant: "destructive"
      });
    }

    if (validFiles.length > 100) {
      toast({
        title: "Too many files",
        description: "Maximum 100 files can be processed at once.",
        variant: "destructive"
      });
      setFiles(validFiles.slice(0, 100));
    } else {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleUploadResumes = async () => {
    if (!files.length) return;

    setIsProcessingResumes(true);
    setUploadProgress(0);
    
    try {
      const newMessage: ChatMessage = {
        role: 'user',
        content: `I'd like to upload ${files.length} resume${files.length > 1 ? 's' : ''}. Please process ${files.length > 1 ? 'them' : 'it'} for me.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // First, inform the assistant
      const initialResponse: ChatMessage = {
        role: 'assistant',
        content: `I'll help you process ${files.length} resume${files.length > 1 ? 's' : ''}. Starting the upload now...`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, initialResponse]);
      
      // Process files in batches
      const batchSize = 5;
      const totalFiles = files.length;
      const batches = Math.ceil(totalFiles / batchSize);
      const processedResults: any[] = [];
      const failedResults: any[] = [];
      
      for (let i = 0; i < batches; i++) {
        const batchFiles = files.slice(i * batchSize, (i + 1) * batchSize);
        
        try {
          const { processed, failed } = await processResumeFiles(batchFiles, user?.id);
          
          if (processed) processedResults.push(...processed);
          if (failed) failedResults.push(...failed);
          
          // Update progress
          const completedFiles = (i + 1) * batchSize > totalFiles ? totalFiles : (i + 1) * batchSize;
          const progress = Math.round((completedFiles / totalFiles) * 100);
          setUploadProgress(progress);
          
          // Update assistant message with progress
          const progressUpdate: ChatMessage = {
            role: 'assistant',
            content: `Processing resumes: ${completedFiles}/${totalFiles} (${progress}% complete)`,
            timestamp: new Date()
          };
          
          setMessages(prev => {
            const updatedMessages = [...prev];
            // Replace the last assistant message with progress update
            if (updatedMessages[updatedMessages.length - 1].role === 'assistant') {
              updatedMessages[updatedMessages.length - 1] = progressUpdate;
            } else {
              updatedMessages.push(progressUpdate);
            }
            return updatedMessages;
          });
        } catch (error) {
          console.error('Error processing batch:', error);
          toast({
            title: "Error processing resumes",
            description: `Batch ${i+1} failed: ${error.message}`,
            variant: "destructive"
          });
        }
      }
      
      // Final completion message
      const successCount = processedResults.length;
      const failedCount = failedResults.length;
      
      const finalMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ Resume processing complete!\n\n${successCount} resume${successCount !== 1 ? 's' : ''} processed successfully${failedCount > 0 ? ` and ${failedCount} failed` : ''}.${
          successCount > 0 ? `\n\nThe candidates have been added to the database and their profiles are now available. You can search for them in the Candidates page.` : ''
        }${
          failedCount > 0 ? `\n\nThe following resumes failed to process: ${failedResults.map(f => f.filename || 'Unknown file').join(', ')}` : ''
        }`,
        timestamp: new Date()
      };
      
      setMessages(prev => {
        const updatedMessages = [...prev];
        // Replace the last assistant message with final message
        if (updatedMessages[updatedMessages.length - 1].role === 'assistant') {
          updatedMessages[updatedMessages.length - 1] = finalMessage;
        } else {
          updatedMessages.push(finalMessage);
        }
        return updatedMessages;
      });
      
      // Clear files after processing
      setFiles([]);
      
    } catch (error) {
      console.error('Resume upload error:', error);
      toast({
        title: "Resume Processing Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `There was an error processing the resumes: ${error.message}. Please try again or contact support.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingResumes(false);
      setUploadProgress(null);
    }
  };

  // Helper function to process resume files
  const processResumeFiles = async (files: File[], userId?: string) => {
    try {
      const result = await supabase.functions.invoke('parse-resumes', {
        body: { files, userId }
      });
      
      if (!result.data?.success) {
        throw new Error(result.data?.error || "Failed to process resumes");
      }
      
      return {
        processed: result.data.processed,
        failed: result.data.failed
      };
    } catch (error) {
      console.error('Error in processResumeFiles:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && files.length === 0) || isLoading) return;
    
    // If there are files, handle resume upload
    if (files.length > 0) {
      await handleUploadResumes();
      return;
    }
    
    const newMessage: ChatMessage = { 
      role: 'user', 
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Prepare message history for context
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Call the AI assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: inputValue,
          userRole: userRole || 'guest',
          userId: user?.id,
          messageHistory,
          model
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Failed to get response");
      }
      
      // Handle special actions if needed
      if (data.action && onAction) {
        onAction(data.action, data.data);
      }
      
      // Add the assistant's response to the chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Error fetching response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get a response from the assistant",
        variant: "destructive"
      });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAssistantIcon = () => {
    if (userRole === 'admin') {
      return model === 'gpt-3.5-turbo' ? 
        <Zap className="h-6 w-6 text-primary" /> : 
        <BrainCircuit className="h-6 w-6 text-primary" />;
    } else {
      return model === 'gpt-3.5-turbo' ? 
        <Zap className="h-6 w-6 text-blue-500" /> : 
        <BrainCircuit className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col">
      <CardContent className="flex flex-col h-full pt-6">
        <div className="flex-1 overflow-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                {getAssistantIcon()}
              </div>
              <h3 className="text-xl font-medium mb-2">
                {userRole === 'admin' ? 'Admin AI Assistant' : 
                 userRole === 'staff' ? 'Staff AI Assistant' : 
                 'Client AI Assistant'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Ask me anything about candidates, jobs, or how to use the ATS system.
                <br />
                I can help with searching, matching, and managing your recruitment workflow.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {userRole !== 'client' && (
                  <>
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
                  </>
                )}
                {userRole === 'client' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="justify-start" 
                      onClick={() => setInputValue("Show me the candidates assigned to me")}
                    >
                      View assigned candidates
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start" 
                      onClick={() => setInputValue("Help me provide feedback for a candidate")}
                    >
                      Provide candidate feedback
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start" 
                      onClick={() => setInputValue("Check the status of my job postings")}
                    >
                      Check job postings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start" 
                      onClick={() => setInputValue("Schedule an interview with a candidate")}
                    >
                      Schedule interview
                    </Button>
                  </>
                )}
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
                  className={`px-4 py-3 rounded-lg max-w-[85%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.timestamp && (
                    <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-lg bg-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* File attachments */}
        {files.length > 0 && (
          <div className="mb-4 p-3 border rounded-lg bg-muted/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFiles([])}
                disabled={isProcessingResumes}
              >
                Clear all
              </Button>
            </div>
            
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {files.slice(0, 5).map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Paperclip className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-5 w-5" 
                    onClick={() => removeFile(index)}
                    disabled={isProcessingResumes}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {files.length > 5 && (
                <div className="text-xs text-muted-foreground pl-4">
                  +{files.length - 5} more files
                </div>
              )}
            </div>
            
            {uploadProgress !== null && (
              <div className="mt-2">
                <div className="h-1 w-full bg-muted">
                  <div 
                    className="h-1 bg-primary" 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right mt-1">
                  {uploadProgress}%
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.csv,.xlsx,.txt"
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessingResumes || files.length >= 100}
            className="flex-shrink-0"
          >
            {isProcessingResumes ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1">
            {files.length > 0 ? (
              <Button 
                className="w-full" 
                onClick={handleUploadResumes}
                disabled={isLoading || isProcessingResumes}
              >
                {isProcessingResumes ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Resumes...
                  </>
                ) : (
                  `Upload and Process ${files.length} ${files.length === 1 ? 'Resume' : 'Resumes'}`
                )}
              </Button>
            ) : (
              <Textarea
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] resize-none"
                disabled={isLoading || isProcessingResumes}
                rows={1}
              />
            )}
          </div>
          {files.length === 0 && (
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputValue.trim()}
              className="flex-shrink-0"
            >
              Send
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format timestamps
function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit'
  });
}
