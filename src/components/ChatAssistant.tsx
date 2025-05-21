
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, Zap, Upload, X, Paperclip, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Render initial welcome message
  useEffect(() => {
    const welcomeMessage = {
      role: 'assistant' as const,
      content: `Hello! I'm your ${userRole === 'admin' ? 'Admin' : 'Staff'} AI Assistant. I can help you with:
        
        • Finding suitable candidates for job openings
        • Processing and analyzing resumes
        • Managing candidate pipelines
        • Assigning candidates to clients
        • Creating and updating job postings
        
        You can also upload resumes directly to me, and I'll process them for you. What would you like to do today?`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  }, [userRole]);

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
    setIsUploading(true);
    
    try {
      const newMessage: ChatMessage = {
        role: 'user',
        content: `I'd like to upload ${files.length} resume${files.length > 1 ? 's' : ''} for processing.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Add system message about starting upload
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I'm uploading and processing ${files.length} resume${files.length > 1 ? 's' : ''}. This may take a moment...`,
        timestamp: new Date()
      }]);
      
      // Call the resume service
      const { data, error } = await supabase.functions.invoke('parse-resume-batch', {
        body: {
          fileCount: files.length,
          userId: user?.id
        }
      });
      
      if (error) throw error;
      
      // For each file, upload to storage and process
      const processed: any[] = [];
      const failed: any[] = [];
      
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          
          // 1. Upload file to Supabase Storage
          const fileExt = file.name.split('.').pop();
          const filePath = `${user?.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          // 2. Get file URL
          const { data: urlData } = supabase.storage
            .from('resumes')
            .getPublicUrl(filePath);
          
          // 3. Process the file (extract text and parse)
          const formData = new FormData();
          formData.append('file', file);
          
          const { data: processedData, error: processError } = await supabase.functions.invoke('parse-resume', {
            body: { 
              resumeUrl: urlData.publicUrl,
              fileName: file.name,
              fileType: file.type
            }
          });
          
          if (processError) throw processError;
          
          // 4. Save the parsed data to database
          const candidateData = {
            ...processedData.data,
            resume_id: filePath,
            resume_url: urlData.publicUrl,
            created_by: user?.id,
            status: 'active',
            pipeline_stage: 'new_candidate'
          };
          
          const { error: saveError } = await supabase
            .from('candidates')
            .insert(candidateData);
            
          if (saveError) throw saveError;
          
          processed.push({ name: file.name });
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        } catch (error) {
          console.error(`Error processing file ${files[i].name}:`, error);
          failed.push({ name: files[i].name, error: error.message });
        }
      }
      
      // Report results
      const resultMessage = {
        role: 'assistant' as const,
        content: `
          ${processed.length > 0 
            ? `✅ Successfully processed ${processed.length} resume${processed.length !== 1 ? 's' : ''}: ${processed.map(p => p.name).join(', ')}` 
            : ''}
          ${failed.length > 0 
            ? `❌ Failed to process ${failed.length} resume${failed.length !== 1 ? 's' : ''}: ${failed.map(f => f.name).join(', ')}` 
            : ''}
          
          The resumes have been added to the candidates database. You can view them in the Candidates section.
        `,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, resultMessage]);
      
      // Clear files after processing
      setFiles([]);
      
    } catch (error) {
      console.error('Error uploading resumes:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error while processing the resumes: ${error.message}. Please try again or upload them through the Candidates page.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingResumes(false);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !files.length) return;
    
    // If there are files, handle them first
    if (files.length > 0) {
      handleUploadResumes();
      return;
    }

    const userMessage = {
      role: 'user' as const,
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI Assistant edge function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: userMessage.content,
          userRole,
          userId: user?.id,
          messageHistory: messages.slice(-10), // Send last 10 messages for context
          model
        }
      });

      if (error) throw error;

      // Handle AI response
      if (data?.success) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Handle any actions from the assistant
        if (data.action && onAction) {
          onAction(data.action, data.data);
        }
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-16rem)]">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div 
                  className={`text-xs mt-1 ${
                    message.role === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* File upload area */}
        {files.length > 0 && (
          <div className="px-4 py-2 border-t border-border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFiles([])}
                disabled={isProcessingResumes}
              >
                Clear all
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-muted rounded-full pl-3 pr-1 py-1"
                >
                  <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-1"
                    onClick={() => removeFile(index)}
                    disabled={isProcessingResumes}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            {isUploading && (
              <div className="mt-2">
                <Progress value={uploadProgress || 0} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadProgress}% - Uploading and processing resumes...
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Input area */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex">
            <Input
              placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || isProcessingResumes}
              className="flex-1"
            />
            <div className="ml-2 flex gap-2">
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
                disabled={isLoading || isProcessingResumes}
                title="Upload resume(s)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && !files.length) || isLoading || isProcessingResumes}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center mt-2">
            <div className="text-xs text-muted-foreground flex items-center">
              {model === 'gpt-3.5-turbo' ? (
                <>
                  <Zap className="h-3 w-3 mr-1 text-blue-500" />
                  GPT-3.5 Turbo
                </>
              ) : (
                <>
                  <BrainCircuit className="h-3 w-3 mr-1 text-purple-500" />
                  GPT-4o
                </>
              )}
            </div>
            {files.length > 0 && (
              <div className="ml-2 text-xs text-muted-foreground">
                <span className="font-medium">{files.length}</span> resume{files.length !== 1 ? 's' : ''} ready
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
