
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

interface CandidateWithLiked extends Partial<Candidate> {
  liked?: boolean;
}

export default function ClientCandidatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<CandidateWithLiked[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchAssignedCandidates();
  }, []);

  const fetchAssignedCandidates = async () => {
    try {
      setIsLoading(true);
      
      // First get the client profile to find assigned_candidates
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('assigned_candidates, liked_candidates')
        .eq('id', user?.id)
        .single();
        
      if (clientError) throw clientError;
      
      if (!clientData?.assigned_candidates?.length) {
        setIsLoading(false);
        return;
      }
      
      // Now fetch the candidate data
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, skills, resume_summary, education, experience, pipeline_stage, status, created_at, updated_at')
        .in('id', clientData.assigned_candidates);
        
      if (candidatesError) throw candidatesError;
      
      // Add liked status to candidates
      const candidatesWithLiked = candidatesData.map(candidate => ({
        ...candidate,
        liked: clientData.liked_candidates?.includes(candidate.id) || false
      })) as CandidateWithLiked[];
      
      setCandidates(candidatesWithLiked);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement client-side filtering for simplicity
    if (!searchQuery.trim()) {
      fetchAssignedCandidates();
      return;
    }
    
    const filtered = candidates.filter(candidate => 
      candidate.skills?.some(skill => 
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      candidate.resume_summary?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setCandidates(filtered);
  };

  const handleLike = async (candidateId: string, isLiked: boolean) => {
    try {
      // First get the client's current liked candidates
      const { data, error } = await supabase
        .from('clients')
        .select('liked_candidates')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      let updatedLikes = [...(data.liked_candidates || [])];
      
      // Update the liked status
      if (isLiked) {
        if (!updatedLikes.includes(candidateId)) {
          updatedLikes.push(candidateId);
        }
      } else {
        updatedLikes = updatedLikes.filter(id => id !== candidateId);
      }
      
      // Update in the database
      const { error: updateError } = await supabase
        .from('clients')
        .update({ liked_candidates: updatedLikes })
        .eq('id', user?.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setCandidates(prev =>
        prev.map(candidate =>
          candidate.id === candidateId ? { ...candidate, liked: isLiked } : candidate
        )
      );
      
      toast({
        title: isLiked ? 'Candidate Liked' : 'Like Removed',
        description: isLiked
          ? 'You have liked this candidate. Recruiter will contact you.'
          : 'You have removed your like for this candidate.',
      });
    } catch (error) {
      console.error('Error updating like status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update candidate preference. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <ClientLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
            <p className="text-muted-foreground">
              View and manage candidates assigned to your company
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2 mt-4 md:mt-0">
            <Input
              type="search"
              placeholder="Search by skills or summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>

        {isLoading ? (
          // Loading state
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={`loading-${i}`} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={`skill-${j}`} className="h-6 w-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : candidates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Candidate Profile</CardTitle>
                  <div className="flex items-center">
                    <Badge variant="outline">{getPipelineStageLabel(candidate.pipeline_stage)}</Badge>
                    {candidate.liked && (
                      <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        You liked this candidate
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Summary</h3>
                      <p className="text-sm line-clamp-3">{candidate.resume_summary || 'No summary available'}</p>
                    </div>
                    
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">Skills</h3>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{candidate.skills.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {candidate.experience && candidate.experience.length > 0 && (
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">Experience</h3>
                        <div className="space-y-2">
                          {candidate.experience.slice(0, 2).map((exp, index) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium">{exp.title} at {exp.company}</p>
                              {exp.start_date && (
                                <p className="text-xs text-muted-foreground">
                                  {exp.start_date} - {exp.current ? 'Present' : (exp.end_date || '')}
                                </p>
                              )}
                            </div>
                          ))}
                          {candidate.experience.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              And {candidate.experience.length - 2} more positions...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2">
                      <Link to={`/client/candidates/${candidate.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      
                      <Button
                        variant={candidate.liked ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleLike(candidate.id, !candidate.liked)}
                        className={candidate.liked ? "border-red-500 text-red-500" : ""}
                      >
                        {candidate.liked ? 'Remove Like' : 'Like Candidate'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium mb-2">No Candidates Found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                No candidates have been assigned to your company yet, or none match your search criteria.
              </p>
              <Button className="mt-4" onClick={() => { setSearchQuery(''); fetchAssignedCandidates(); }}>
                Reset Search
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
}

function getPipelineStageLabel(stage?: string): string {
  if (!stage) return 'New';
  
  const labels: Record<string, string> = {
    new_candidate: 'New',
    screening: 'Screening',
    interview_scheduled: 'Interview Scheduled',
    interview_completed: 'Interview Completed',
    technical_assessment: 'Assessment',
    reference_check: 'Reference Check',
    offer_pending: 'Offer Pending',
    offer_sent: 'Offer Sent',
    offer_accepted: 'Accepted',
    offer_rejected: 'Rejected',
    onboarding: 'Onboarding',
    hired: 'Hired',
    rejected: 'Rejected'
  };
  
  return labels[stage] || stage;
}
