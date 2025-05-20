
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  XMarkIcon, 
  CloudArrowUpIcon, 
  DocumentIcon, 
  ExclamationTriangleIcon, 
  TrashIcon,
  DocumentCheckIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import { processMultipleResumes, saveProcessedCandidate } from '@/services/resumeService';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface FileWithPreview extends File {
  preview?: string;
  error?: string;
}

export default function CandidateUploadPage() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    completed: 0,
    total: 0,
    success: 0,
    failed: 0,
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 100,
    onDrop: useCallback((acceptedFiles, rejectedFiles) => {
      // Add accepted files
      setFiles(prev => [
        ...prev, 
        ...acceptedFiles.map(file => Object.assign(file, {
          preview: URL.createObjectURL(file)
        }))
      ]);
      
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(rejectedFile => {
          const reason = rejectedFile.errors[0]?.message || 'Invalid file';
          toast({
            title: 'File rejected',
            description: `${rejectedFile.file.name}: ${reason}`,
            variant: 'destructive',
          });
        });
      }
    }, [toast])
  });

  // Remove a file from the list
  const removeFile = (file: FileWithPreview) => {
    setFiles(files => files.filter(f => f !== file));
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
  };

  // Clear all files
  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  // Upload and process all files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one resume file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress({
      completed: 0,
      total: files.length,
      success: 0,
      failed: 0,
    });
    
    try {
      // Process all resumes
      const { processed, failed } = await processMultipleResumes(files);
      
      // Save processed candidates to database
      for (const item of processed) {
        try {
          const candidateData = {
            ...item.candidateData,
            created_by: user?.id,
            resumeText: item.resumeText // This isn't saved to DB but used for embedding generation
          };
          
          await saveProcessedCandidate(candidateData);
          
          setUploadProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            success: prev.success + 1,
          }));
        } catch (error) {
          console.error('Error saving candidate to database:', error);
          setUploadProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            failed: prev.failed + 1,
          }));
        }
      }
      
      // Update progress for failed items
      failed.forEach(() => {
        setUploadProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
          failed: prev.failed + 1,
        }));
      });
      
      toast({
        title: 'Upload complete',
        description: `Successfully processed ${processed.length} resumes. Failed: ${failed.length}.`,
        variant: processed.length > 0 ? 'default' : 'destructive',
      });
      
      if (processed.length > 0) {
        setTimeout(() => {
          navigate('/candidates');
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing resumes:', error);
      toast({
        title: 'Upload failed',
        description: 'An error occurred while processing the resumes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Resumes</h1>
          <p className="text-muted-foreground">
            Upload candidate resumes for automatic processing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resume Upload</CardTitle>
            <CardDescription>
              Upload resumes in PDF, DOC, DOCX, CSV, or TXT format. Maximum 100 files, 5MB each.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary hover:bg-primary/5'}
                ${isDragReject ? 'border-red-500 bg-red-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag &amp; drop resume files here, or click to select files
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, CSV, TXT (Max 5MB each)
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-sm">Selected Files ({files.length})</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFiles}
                    disabled={isUploading}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                
                <div className="grid gap-2 max-h-60 overflow-y-auto p-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {file.type === 'application/pdf' ? (
                          <DocumentIcon className="h-5 w-5 text-red-500" />
                        ) : file.type.includes('word') ? (
                          <DocumentIcon className="h-5 w-5 text-blue-500" />
                        ) : file.type.includes('csv') || file.type.includes('sheet') ? (
                          <DocumentIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <DocumentIcon className="h-5 w-5 text-gray-500" />
                        )}
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                        {file.error && (
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file)}
                        disabled={isUploading}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Processing resumes...</span>
                  <span className="text-sm text-muted-foreground">
                    {uploadProgress.completed}/{uploadProgress.total}
                  </span>
                </div>
                <Progress 
                  value={(uploadProgress.completed / uploadProgress.total) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <DocumentCheckIcon className="h-4 w-4 text-green-500 mr-1" />
                    Success: {uploadProgress.success}
                  </span>
                  <span className="flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                    Failed: {uploadProgress.failed}
                  </span>
                </div>
              </div>
            )}

            {!files.length && !isUploading && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
                  <DocumentPlusIcon className="h-4 w-4 mr-2" />
                  Select Files
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/candidates')}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? 'Processing...' : 'Upload & Process'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
