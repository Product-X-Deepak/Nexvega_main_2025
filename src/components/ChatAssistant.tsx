
import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/contexts/AuthContext';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { processMultipleResumes, saveProcessedCandidateToDatabase } from '@/lib/resumeProcessing';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FilePreview {
  file: File;
  preview: string;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, isStaff } = useAuth();
  const { toast } = useToast();
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 100) {
        toast({
          title: 'Too many files',
          description: 'You can upload up to 100 files at a time',
          variant: 'destructive'
        });
        return;
      }
      
      const totalSize = acceptedFiles.reduce((acc, file) => acc + file.size, 0);
      if (totalSize > 500 * 1024 * 1024) { // 500MB limit
        toast({
          title: 'Files too large',
          description: 'Total file size should not exceed 500MB',
          variant: 'destructive'
        });
        return;
      }
      
      setFiles(prevFiles => [
        ...prevFiles,
        ...acceptedFiles.map(file => ({
          file,
          preview: URL.createObjectURL(file)
        }))
      ]);
    },
    noClick: true,
    noKeyboard: true
  });

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up previews
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const sendMessage = async () => {
    if (!input.trim() && files.length === 0) return;
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input || (files.length > 0 ? `Uploaded ${files.length} file(s)` : ''),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // If files were uploaded, process them
    if (files.length > 0) {
      setIsProcessing(true);
      
      try {
        // Create initial processing message
        const initialResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: `Processing ${files.length} file(s). This may take a while...`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, initialResponse]);
        
        // Process the resumes
        const uploadedFiles = files.map(file => file.file);
        const { processed, failed } = await processMultipleResumes(uploadedFiles);
        
        // Save processed candidates to database
        for (const item of processed) {
          await saveProcessedCandidateToDatabase(item.candidateData);
        }
        
        // Create response message
        const responseContent = `
          Successfully processed ${processed.length} file(s).
          ${failed.length > 0 ? `Failed to process ${failed.length} file(s).` : ''}
          ${processed.length > 0 ? 'Candidates have been added to the database.' : ''}
        `;
        
        const responseMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'assistant',
          content: responseContent.trim(),
          timestamp: new Date()
        };
        
        setMessages(prev => {
          // Remove the initial processing message
          const filtered = prev.filter(msg => msg.id !== initialResponse.id);
          return [...filtered, responseMessage];
        });
        
        // Clear the files
        setFiles([]);
        
        // Show toast
        toast({
          title: 'Resume Processing Complete',
          description: `Processed ${processed.length} resumes. Failed: ${failed.length}.`,
        });
      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'assistant',
          content: `Error processing files: ${(error as Error).message}`,
          timestamp: new Date()
        };
        
        setMessages(prev => {
          // Find and remove the initial processing message
          const filtered = prev.filter(msg => msg.id !== (Date.now() + 1).toString());
          return [...filtered, errorMessage];
        });
        
        toast({
          title: 'Error',
          description: 'Failed to process resumes. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Simulate AI response (in a real app, this would call your OpenAI API)
      setIsProcessing(true);
      
      setTimeout(() => {
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          content: "I'm your AI assistant. How can I help you today? You can upload resumes, ask me about candidates, or request help with any ATS-related tasks.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, responseMessage]);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-primary text-primary-foreground">
        <h2 className="text-lg font-semibold">
          {isAdmin() ? 'Admin Assistant' : 'Staff Assistant'}
        </h2>
        <p className="text-sm opacity-90">
          Upload resumes, manage candidates, and get help with ATS tasks
        </p>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-medium">Welcome to the ATS Assistant</h3>
              <p className="max-w-md">
                Upload resumes or ask questions to get started. I can help with candidate management, 
                job postings, and many other ATS-related tasks.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* File upload preview */}
      {files.length > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 max-h-36 overflow-y-auto">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Files to upload ({files.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="relative inline-flex items-center bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm">
                <span className="truncate max-w-[120px]">{file.file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* File dropzone and message input */}
      <div
        {...getRootProps()}
        className={`border-t border-gray-200 dark:border-gray-700 p-4 ${
          isDragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={open}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isProcessing}
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message or drop files here..."
            className="flex-1 border-none focus:ring-0 focus:outline-none bg-transparent"
            disabled={isProcessing}
          />
          <button
            type="button"
            onClick={sendMessage}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(!input.trim() && files.length === 0) || isProcessing}
          >
            {isProcessing ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {isDragActive && (
          <div className="absolute inset-0 bg-blue-100/80 dark:bg-blue-900/30 flex items-center justify-center rounded-lg z-10">
            <div className="text-lg font-medium text-blue-800 dark:text-blue-200">
              Drop your files here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
