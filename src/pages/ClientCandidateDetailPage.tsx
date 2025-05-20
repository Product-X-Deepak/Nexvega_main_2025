
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Candidate } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { HeartIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ClientCandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCandidate(id);
      checkIfCandidateLiked(id);
    }
  }, [id, user?.id]);

  const fetchCandidate = async (candidateId: string) => {
    try {
      setIsLoading(true);
      
      // Get only the permitted fields for clients
      const { data, error } = await supabase
        .from('candidates')
        .select('id, skills, resume_summary, education, experience, languages, projects, publications, pipeline_stage')
        .eq('id', candidateId)
        .single();
        
      if (error) throw error;
      
      // Check if this candidate is assigned to this client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('assigned_candidates')
        .eq('id', user?.id)
        .single();
        
      if (clientError) throw clientError;
      
      if (!clientData.assigned_candidates?.includes(candidateId)) {
        toast({
          title: 'Access denied',
          description: 'You do not have permission to view this candidate',
          variant: 'destructive',
        });
        navigate('/client/candidates');
        return;
      }
      
      setCandidate(data as Candidate);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidate profile',
        variant: 'destructive',
      });
      navigate('/client/candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfCandidateLiked = async (candidateId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('liked_candidates')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      setIsLiked(data.liked_candidates?.includes(candidateId) || false);
    } catch (error) {
      console.error('Error checking if candidate is liked:', error);
    }
  };

  const handleLikeToggle = async () => {
    try {
      if (!candidate) return;
      
      setIsSubmitting(true);
      
      // Get current liked candidates
      const { data, error } = await supabase
        .from('clients')
        .select('liked_candidates')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      let updatedLikes = [...(data.liked_candidates || [])];
      
      // Update the liked status
      if (!isLiked) {
        if (!updatedLikes.includes(candidate.id)) {
          updatedLikes.push(candidate.id);
        }
      } else {
        updatedLikes = updatedLikes.filter(id => id !== candidate.id);
      }
      
      // Update in the database
      const { error: updateError } = await supabase
        .from('clients')
        .update({ liked_candidates: updatedLikes })
        .eq('id', user?.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setIsLiked(!isLiked);
      
      toast({
        title: !isLiked ? 'Candidate Liked' : 'Like Removed',
        description: !isLiked
          ? 'You have liked this candidate. Recruiter will contact you.'
          : 'You have removed your like for this candidate.',
      });
    } catch (error) {
      console.error('Error toggling like status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update candidate preference',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      if (!candidate) return;
      if (!rejectionReason.trim()) {
        toast({
          title: 'Reason required',
          description: 'Please provide a reason for rejection',
          variant: 'destructive',
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Add rejection reason
      const { error } = await supabase
        .from('rejection_reasons')
        .insert({
          candidate_id: candidate.id,
          client_id: user?.id,
          reason: rejectionReason,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // If candidate was liked, remove from liked candidates
      if (isLiked) {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('liked_candidates')
          .eq('id', user?.id)
          .single();
          
        if (fetchError) throw fetchError;
        
        const updatedLikes = (data.liked_candidates || []).filter(id => id !== candidate.id);
        
        const { error: updateError } = await supabase
          .from('clients')
          .update({ liked_candidates: updatedLikes })
          .eq('id', user?.id);
          
        if (updateError) throw updateError;
        
        setIsLiked(false);
      }
      
      toast({
        title: 'Candidate Rejected',
        description: 'Your feedback has been submitted successfully',
      });
      
      setRejectionReason('');
      setIsRejecting(false);
      
      // Redirect back to candidates list
      setTimeout(() => {
        navigate('/client/candidates');
      }, 1500);
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rejection feedback',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="animate-pulse space-y-5">
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
          <p className="mt-2 text-muted-foreground">The candidate you are looking for does not exist or is not assigned to you.</p>
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
            <h1 className="text-2xl font-bold tracking-tight">
              Candidate Profile
            </h1>
            <p className="text-muted-foreground">
              Review candidate details and provide feedback
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isLiked ? "outline" : "default"}
              onClick={handleLikeToggle}
              disabled={isSubmitting}
              className={isLiked ? "border-red-500 text-red-500" : ""}
            >
              <HeartIcon className={`h-4 w-4 mr-2 ${isLiked ? "fill-red-500" : ""}`} />
              {isLiked ? 'Remove Interest' : 'Express Interest'}
            </Button>
            
            {!isRejecting && (
              <Button
                variant="outline"
                onClick={() => setIsRejecting(true)}
                disabled={isSubmitting}
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Not Suitable
              </Button>
            )}
          </div>
        </div>

        {isRejecting ? (
          <Card>
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
              <CardDescription>
                Please tell us why this candidate is not suitable for your requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Please provide detailed feedback..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[150px]"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsRejecting(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4 mt-4">
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
            </TabsContent>
            
            <TabsContent value="experience" className="space-y-4 mt-4">
              {candidate.experience && candidate.experience.length > 0 ? (
                candidate.experience.map((exp, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{exp.title}</CardTitle>
                      <CardDescription>
                        {exp.company} {exp.location ? `• ${exp.location}` : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                          </p>
                        </div>
                        
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">Responsibilities</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              {exp.responsibilities.map((responsibility, idx) => (
                                <li key={idx} className="text-sm">{responsibility}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">No work experience listed</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="education" className="space-y-4 mt-4">
              {candidate.education && candidate.education.length > 0 ? (
                candidate.education.map((edu, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{edu.degree}</CardTitle>
                      <CardDescription>{edu.institution}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {edu.field_of_study}
                        </p>
                        {(edu.start_date || edu.end_date) && (
                          <p className="text-sm text-muted-foreground">
                            {edu.start_date} - {edu.end_date}
                          </p>
                        )}
                        {edu.grade && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Grade:</span> {edu.grade}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">No education details listed</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="projects" className="space-y-4 mt-4">
              {candidate.projects && candidate.projects.length > 0 ? (
                candidate.projects.map((project, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      {(project.start_date || project.end_date) && (
                        <CardDescription>
                          {project.start_date} - {project.end_date || 'Present'}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {project.description && (
                          <p>{project.description}</p>
                        )}
                        
                        {project.technologies && project.technologies.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">Technologies</h3>
                            <div className="flex flex-wrap gap-2">
                              {project.technologies.map((tech, idx) => (
                                <Badge key={idx} variant="outline">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {project.url && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">Project URL</h3>
                            <a 
                              href="#" 
                              onClick={(e) => e.preventDefault()}
                              className="text-blue-600 hover:underline disabled-link"
                            >
                              View Project (Contact recruiter for access)
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">No projects listed</p>
                  </CardContent>
                </Card>
              )}
              
              {candidate.publications && candidate.publications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Publications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.publications.map((pub, index) => (
                        <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                          <h3 className="font-medium">{pub.title}</h3>
                          {pub.publisher && (
                            <p className="text-sm text-muted-foreground">
                              {pub.publisher} {pub.date ? `• ${pub.date}` : ''}
                            </p>
                          )}
                          {pub.description && (
                            <p className="text-sm mt-2">{pub.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ClientLayout>
  );
}
