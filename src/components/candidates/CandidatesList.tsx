
import React from 'react';
import { Search, PlusCircle, Upload } from 'lucide-react';
import { Candidate } from '@/types';
import CandidateCard from './CandidateCard';
import { Button } from '@/components/ui/button';

interface CandidatesListProps {
  loading: boolean;
  candidates: Candidate[];
  onAddCandidate: () => void;
  onUploadResumes: () => void;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
  loading,
  candidates,
  onAddCandidate,
  onUploadResumes
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div 
            key={index} 
            className="h-64 rounded-lg border border-border bg-card p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div>
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-3 w-24 bg-muted rounded mt-2"></div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-6 w-12 bg-muted rounded"></div>
              <div className="h-6 w-12 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (candidates.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No candidates found</h3>
        <p className="text-muted-foreground">
          Get started by adding candidates or uploading resumes
        </p>
        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            onClick={onUploadResumes}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Resumes
          </Button>
          <Button 
            onClick={onAddCandidate}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {candidates.map((candidate) => (
        <CandidateCard 
          key={candidate.id} 
          candidate={candidate} 
        />
      ))}
    </div>
  );
};

export default CandidatesList;
