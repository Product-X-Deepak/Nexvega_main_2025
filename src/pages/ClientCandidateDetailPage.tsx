
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/types';

export default function ClientCandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (error) throw error;
      
      // Convert the returned data to match our Candidate type
      setCandidate({
        ...data,
        education: Array.isArray(data.education) ? data.education : [],
        experience: Array.isArray(data.experience) ? data.experience : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        publications: Array.isArray(data.publications) ? data.publications : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        embedding: Array.isArray(data.embedding) ? data.embedding : undefined
      } as Candidate);
      
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
      
      setIsLiked(data.liked_candidates?.includes(candidateId) || false);
    } catch (error) {
      console.error('Error checking if candidate is liked:', error);
    }
  };

  const handleLike = async () => {
    try {
      // First get the client's current liked candidates
      const { data, error } = await supabase
        .from('clients')
        .select('liked_candidates')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      let updatedLikes = [...(data.liked_candidates || [])];
      
      if (isLiked) {
        // Remove from liked
        updatedLikes = updatedLikes.filter(likeId => likeId !== id);
      } else {
        // Add to liked
        if (!updatedLikes.includes(id!)) {
          updatedLikes.push(id!);
        }
      }
      
      // Update in the database
      const { error: updateError } = await supabase
        .from('clients')
        .update({ liked_candidates: updatedLikes })
        .eq('id', user?.id);
        
      if (updateError) throw updateError;
      
      setIsLiked(!isLiked);
      
      toast({
        title: isLiked ? 'Removed from Liked' : 'Added to Liked',
        description: isLiked
          ? 'This candidate has been removed from your liked candidates.'
          : 'This candidate has been added to your liked candidates. Our team will be in touch!',
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
        title: 'Empty Feedback',
        description: 'Please provide feedback before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('candidate_notes')
        .insert({
          candidate_id: id,
          user_id: user?.id,
          content: feedback,
          type: 'feedback',
        });
        
      if (error) throw error;
      
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });
      
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
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
          <p className="mt-2 text-muted-foreground">
            This candidate profile is not available or may have been removed.
          </p>
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
              Review details and provide feedback
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={isLiked ? "outline" : "default"}
              onClick={handleLike}
              className={isLiked ? "border-red-500 text-red-500" : ""}
            >
              {isLiked ? 'Remove Like' : 'Like This Candidate'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/client/candidates')}>
              Back to Candidates
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-grid md:grid-cols-3">
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
                        <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
                          <p className="font-medium">{edu.degree}</p>
                          <p>{edu.institution}</p>
                          <p className="text-sm text-muted-foreground">
                            {edu.field_of_study}
                            {edu.start_date && `, ${edu.start_date} - ${edu.end_date || 'Present'}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No education details listed</p>
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
                      <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{exp.title}</h3>
                            <p>{exp.company}</p>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {exp.start_date && `${exp.start_date} - ${exp.current ? 'Present' : (exp.end_date || '')}`}
                          </p>
                        </div>
                        {exp.location && (
                          <p className="text-sm text-muted-foreground mb-2">{exp.location}</p>
                        )}
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Responsibilities:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {exp.responsibilities.map((item, idx) => (
                                <li key={idx} className="text-sm">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No work experience listed</p>
                )}
              </CardContent>
            </Card>
            
            {candidate.projects && candidate.projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {candidate.projects.map((project, index) => (
                      <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                        <h3 className="font-medium">{project.name}</h3>
                        {project.description && <p className="text-sm mt-1">{project.description}</p>}
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.technologies.map((tech, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{tech}</Badge>
                            ))}
                          </div>
                        )}
                        {project.url && (
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          >
                            View Project
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Provide Feedback</CardTitle>
                <CardDescription>
                  Your feedback helps us understand your needs and improve our candidate matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your thoughts about this candidate's fit for your company..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting || !feedback.trim()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>If you're interested in this candidate:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Click the "Like This Candidate" button to express interest</li>
                    <li>Our recruitment team will contact you to discuss next steps</li>
                    <li>We'll coordinate interviews and facilitate the hiring process</li>
                  </ol>
                  
                  <div className="border-t pt-4 mt-4">
                    <p className="font-medium">Need more information?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact your account manager for additional details about this candidate
                      or to request specific information not shown in the profile.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
