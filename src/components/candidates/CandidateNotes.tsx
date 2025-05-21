
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CandidateNote, NoteType } from '@/types';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Loader2, PlusCircle } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CandidateNotesProps {
  notes: CandidateNote[];
  candidateId: string;
  loading: boolean;
  onAddNote: (note: Omit<CandidateNote, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const noteTypeOptions: { value: NoteType; label: string; }[] = [
  { value: 'general', label: 'General' },
  { value: 'interview', label: 'Interview' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'rejection', label: 'Rejection' },
  { value: 'other', label: 'Other' },
];

const CandidateNotes: React.FC<CandidateNotesProps> = ({ 
  notes, 
  candidateId, 
  loading, 
  onAddNote 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('general');
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!content.trim() || !user?.id) return;
    
    setSubmitting(true);
    
    try {
      await onAddNote({
        candidate_id: candidateId,
        user_id: user.id,
        content: content.trim(),
        type: noteType
      });
      
      // Clear form after successful submission
      setContent('');
      setNoteType('general');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add note form */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add Note</h3>
        <div className="grid grid-cols-1 gap-3">
          <Textarea
            placeholder="Enter your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex items-center gap-3">
            <Select
              value={noteType}
              onValueChange={(value) => setNoteType(value as NoteType)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Note type" />
              </SelectTrigger>
              <SelectContent>
                {noteTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="ml-auto"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add Note
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Notes list */}
      <div>
        <h3 className="text-lg font-medium mb-4">Notes History</h3>
        
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-md animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => {
              // Find the matching note type to display the label
              const noteTypeObj = noteTypeOptions.find(t => t.value === note.type);
              // Format the date
              const formattedDate = format(parseISO(note.created_at), 'MMM d, yyyy h:mm a');
              
              return (
                <div 
                  key={note.id} 
                  className={cn(
                    "p-4 border rounded-md",
                    note.type === 'feedback' && "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900",
                    note.type === 'interview' && "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-900",
                    note.type === 'rejection' && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="font-medium">
                        {note.profiles?.full_name || 'Unknown User'}
                      </span>
                      <span className={cn(
                        "ml-2 px-2 py-0.5 text-xs rounded-full",
                        note.type === 'general' && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                        note.type === 'feedback' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
                        note.type === 'interview' && "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
                        note.type === 'rejection' && "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
                        note.type === 'other' && "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
                      )}>
                        {noteTypeObj?.label || note.type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">
                    {note.content}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="text-lg font-medium">No Notes Yet</h4>
            <p className="text-muted-foreground">
              Be the first to add notes about this candidate
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateNotes;
