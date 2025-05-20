
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Candidate } from '@/types';
import { DocumentTextIcon, BriefcaseIcon, AcademicCapIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ClientCandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCandidate(id);
      checkIfLiked(id);
    }
  }, [id]);

  const fetchCandidate = async (candidateId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('candidates')
        .select('skills, resume_summary, education, experience, projects, languages, pipeline_stage')
        .eq('id', candidateId)
        .single();
        
      if (error) throw error;
      
      // Store only non-confidential data
      setCandidate({
        id: candidateId,
        skills: data.skills,
        resume_summary: data.resume_summary,
        education: data.education,
        experience: data.experience,
        projects: data.projects,
        languages: data.languages,
        pipeline_stage: data.pipeline_stage,
        // Add placeholders for required fields
        status: 'active',
        created_at: '',
        updated_at: ''
      });
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidate details',
        variant: 'destructive',
      });
      navigate('/client/candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfLiked = async (candidateId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('liked_candidates')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      const liked = data.liked_candidates?.includes(candidateId) || false;
      setIsLiked(liked);
    } catch (error) {
      console.error('Error checking liked status:', error);
    }
  };

  const handleLikeToggle = async () => {
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
      if (!isLiked) {
        if (!updatedLikes.includes(id!)) {
          updatedLikes.push(id!);
        }
      } else {
        updatedLikes = updatedLikes.filter(candidateId => candidateId !== id);
      }
      
      // Update in the database
      const { error: updateError } = await supabase
        .from('clients')
        .update({ liked_candidates: updatedLikes })
        .eq('id', user?.id);
        
      if (updateError) throw updateError;
      
      setIsLiked(!isLiked);
      
      toast({
        title: !isLiked ? 'Candidate Liked' : 'Like Removed',
        description: !isLiked
          ? 'You have liked this candidate. Recruiter will contact you.'
          : 'You have removed your like for this candidate.',
      });
    } catch (error) {
      console.error('Error updating like status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update candidate preference',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter feedback before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmittingFeedback(true);
      
      const { error } = await supabase
        .from('candidate_notes')
        .insert({
          candidate_id: id,
          user_id: user?.id,
          content: feedback,
          type: 'feedback',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for providing feedback on this candidate',
      });
      
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmittingRejection(true);
      
      const { error } = await supabase
        .from('rejection_reasons')
        .insert({
          candidate_id: id,
          client_id: user?.id,
          reason: rejectionReason,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // If liked, remove from liked candidates
      if (isLiked) {
        await handleLikeToggle();
      }
      
      toast({
        title: 'Candidate Rejected',
        description: 'Thank you for providing feedback. Your recruiter will be notified.',
      });
      
      setRejectionReason('');
      
      // Navigate back to candidates list after a delay
      setTimeout(() => {
        navigate('/client/candidates');
      }, 1500);
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rejection',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </ClientLayout>
    );
  }

  if (!candidate) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Candidate Not Found</h2>
          <p className="mt-2 text-muted-foreground">The candidate you are looking for does not exist or has been removed.</p>
          <Button className="mt-4" onClick={() => navigate('/client/candidates')}>
            Back to Candidates
          </Button>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Candidate Profile
              </h1>
              <Badge variant="outline">{getPipelineStageLabel(candidate.pipeline_stage)}</Badge>
            </div>
            <p className="text-muted-foreground">
              Candidate details and information
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isLiked ? "outline" : "default"}
              onClick={handleLikeToggle}
              className={isLiked ? "border-red-500 text-red-500" : ""}
            >
              {isLiked ? 'Remove Like' : 'Like Candidate'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="feedback">Provide Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Professional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{candidate.resume_summary || 'No summary available'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.skills && candidate.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No skills listed</p>
                )}
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.languages && candidate.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.languages.map((language, index) => (
                        <Badge key={index} variant="outline">{language}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No languages listed</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Education</CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.education && candidate.education.length > 0 ? (
                    <div className="space-y-3">
                      {candidate.education.map((edu, index) => (
                        <div key={index} className="flex gap-3">
                          <AcademicCapIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-medium">{edu.degree} in {edu.field_of_study}</p>
                            <p className="text-sm">{edu.institution}</p>
                            {edu.start_date && (
                              <p className="text-xs text-muted-foreground">
                                {edu.start_date} - {edu.end_date || 'Present'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No education history listed</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="experience" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.experience && candidate.experience.length > 0 ? (
                  <div className="space-y-6">
                    {candidate.experience.map((exp, index) => (
                      <div key={index} className="flex gap-3">
                        <BriefcaseIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-medium">{exp.title}</p>
                          <p className="text-sm">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                          {exp.start_date && (
                            <p className="text-sm text-muted-foreground">
                              {exp.start_date} - {exp.current ? 'Present' : (exp.end_date || '')}
                            </p>
                          )}
                          {exp.responsibilities && exp.responsibilities.length > 0 && (
                            <ul className="mt-2 list-disc pl-4 space-y-1 text-sm">
                              {exp.responsibilities.map((resp, i) => (
                                <li key={i}>{resp}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No work experience listed</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.projects && candidate.projects.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.projects.map((project, index) => (
                      <div key={index} className="flex gap-3">
                        <DocumentTextIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-medium">
                            {project.name}
                            {project.url && (
                              <a href={project.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-blue-600 hover:underline">
                                View Project
                              </a>
                            )}
                          </p>
                          {project.description && (
                            <p className="text-sm mt-1">{project.description}</p>
                          )}
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.technologies.map((tech, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          )}
                          {project.start_date && (
                            <div className="flex items-center mt-2 text-xs text-muted-foreground">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              <span>{project.start_date} - {project.end_date || 'Present'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No projects listed</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Provide Feedback</CardTitle>
                <CardDescription>
                  Let us know what you think about this candidate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="feedback" className="block font-medium">Your Feedback</label>
                    <Textarea 
                      id="feedback"
                      placeholder="Please share your thoughts on this candidate's qualifications, fit for your organization, etc."
                      rows={5}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitFeedback}
                      disabled={!feedback.trim() || isSubmittingFeedback}
                    >
                      {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reject Candidate</CardTitle>
                <CardDescription>
                  If this candidate is not a good fit, please let us know why
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="rejection" className="block font-medium">Reason for Rejection</label>
                    <Textarea 
                      id="rejection"
                      placeholder="Please explain why this candidate is not suitable for your needs"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || isSubmittingRejection}
                  >
                    {isSubmittingRejection ? 'Submitting...' : 'Reject Candidate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
