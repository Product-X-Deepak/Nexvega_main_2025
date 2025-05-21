
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Upload, UserPlus } from 'lucide-react';

interface CandidatesHeaderProps {
  onRefresh: () => void;
  onBulkExport: () => void;
  onUploadResumes: () => void;
  onAddCandidate: () => void;
}

const CandidatesHeader: React.FC<CandidatesHeaderProps> = ({
  onRefresh,
  onBulkExport,
  onUploadResumes,
  onAddCandidate
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground">
          Manage and track all candidate profiles
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBulkExport}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUploadResumes}
          className="flex items-center gap-1"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Resumes</span>
        </Button>
        
        <Button 
          size="sm" 
          onClick={onAddCandidate}
          className="flex items-center gap-1"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Candidate</span>
        </Button>
      </div>
    </div>
  );
};

export default CandidatesHeader;
