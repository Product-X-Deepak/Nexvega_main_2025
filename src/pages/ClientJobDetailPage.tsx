
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types';

export default function ClientJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedCandidateCount, setMatchedCandidateCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchJob(id);
      fetchMatchedCandidatesCount(id);
    }
  }, [id]);

  const fetchJob = async (jobId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (error) throw error;
      
      setJob(data as Job);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
      navigate('/client/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchedCandidatesCount = async (jobId: string) => {
    try {
      // Example API call - in a real app this would call the Supabase edge function
      // to fetch matched candidates
      const { data, error } = await supabase
        .from('search_results')
        .select('candidate_ids')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0 && data[0].candidate_ids) {
        setMatchedCandidateCount(data[0].candidate_ids.length);
      }
    } catch (error) {
      console.error('Error fetching matched candidates count:', error);
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
    
    // In a real implementation, this would save the feedback to the database
    setTimeout(() => {
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback on this job posting!',
      });
      
      setFeedback('');
      setIsSubmitting(false);
    }, 1000);
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

  if (!job) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Job Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            This job posting is not available or may have been removed.
          </p>
          <Button className="mt-4" onClick={() => navigate('/client/jobs')}>
            Back to Jobs
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
              {job.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{job.job_type}</Badge>
              <span className="text-muted-foreground">{job.location || 'Remote'}</span>
            </div>
          </div>
          
          <Button variant="outline" onClick={() => navigate('/client/jobs')}>
            Back to Jobs
          </Button>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-grid md:grid-cols-3">
            <TabsTrigger value="details">Job Details</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="feedback">Provide Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{job.description || 'No description available'}</p>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.requirements && job.requirements.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {job.requirements.map((requirement, index) => (
                        <li key={index}>{requirement}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No specific requirements listed</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.responsibilities && job.responsibilities.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index}>{responsibility}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No specific responsibilities listed</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Salary Range</h3>
                    <p>{job.salary_range || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Created On</h3>
                    <p>{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="candidates" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Matched Candidates</CardTitle>
                <CardDescription>
                  Candidates that match this job's requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchedCandidateCount > 0 ? (
                  <div className="space-y-4">
                    <p>
                      We've found {matchedCandidateCount} potential candidates matching this job's requirements.
                    </p>
                    <p className="text-muted-foreground">
                      Our recruiting team has already started the screening process for these candidates and will 
                      send qualified candidates to your dashboard for review.
                    </p>
                    <Button
                      onClick={() => navigate('/client/candidates')}
                    >
                      View Available Candidates
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="mb-4">
                      We're actively searching for candidates matching this job's requirements.
                    </p>
                    <p className="text-muted-foreground">
                      Matched candidates will appear here and be added to your candidate dashboard
                      as they become available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Provide Feedback</CardTitle>
                <CardDescription>
                  Your feedback helps us improve our job postings and candidate matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your feedback about this job posting..."
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
                <CardTitle>Request Job Modification</CardTitle>
                <CardDescription>
                  Need changes to this job posting?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  If you need to make changes to this job posting, such as updating requirements, 
                  responsibilities, or other details, please contact your account manager.
                </p>
                <Button variant="outline">
                  Contact Account Manager
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
