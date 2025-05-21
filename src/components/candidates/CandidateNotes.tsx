
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { NoteType, CandidateNote } from '@/types';
import { MessageCircle, Send, AlertCircle, CheckCircle, Phone, Star, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CandidateNotesProps {
  notes: CandidateNote[];
  candidateId: string;
  loading: boolean;
  onAddNote: (note: Omit<CandidateNote, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const noteTypes: Array<{ value: NoteType; label: string; icon: React.ReactNode }> = [
  { value: 'general', label: 'General Note', icon: <MessageCircle className="h-4 w-4" /> },
  { value: 'interview', label: 'Interview Note', icon: <Phone className="h-4 w-4" /> },
  { value: 'feedback', label: 'Feedback', icon: <Star className="h-4 w-4" /> },
  { value: 'rejection', label: 'Rejection', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <AlertCircle className="h-4 w-4" /> },
];

const getInitials = (name: string | undefined): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const CandidateNotes: React.FC<CandidateNotesProps> = ({ 
  notes, 
  candidateId, 
  loading,
  onAddNote 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user?.id || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddNote({
        candidate_id: candidateId,
        user_id: user.id,
        content,
        type: noteType
      });
      
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Add Note</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note Type</label>
              <Select 
                value={noteType} 
                onValueChange={(value) => setNoteType(value as NoteType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select note type" />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        {type.icon}
                        <span className="ml-2">{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="note-content">
                Note Content
              </label>
              <Textarea
                id="note-content"
                placeholder="Enter your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-32 resize-none"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={!content.trim() || isSubmitting}
            className="ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Add Note
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notes & Activity</h3>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>
                          {getInitials((note as any).profiles?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {(note as any).profiles?.full_name || 'Unknown User'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {note.created_at && (
                            formatDistanceToNow(new Date(note.created_at), { addSuffix: true })
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Note type badge */}
                    <div className="flex items-center text-xs bg-muted px-2 py-1 rounded-md">
                      {noteTypes.find(t => t.value === note.type)?.icon}
                      <span className="ml-1 capitalize">{note.type}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line text-sm">
                    {note.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium">No Notes Yet</h3>
            <p className="text-muted-foreground">
              Add the first note about this candidate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateNotes;
