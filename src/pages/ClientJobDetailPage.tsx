
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types';

export default function ClientJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchJob(id);
    }
  }, [id]);

  const fetchJob = async (jobId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'published')
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
          <p className="mt-2 text-muted-foreground">The job you are looking for does not exist or is no longer active.</p>
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {job.title}
              </h1>
              <Badge variant="outline">
                {job.job_type}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {job.location || 'Remote/Various'}
            </p>
          </div>
          
          <div>
            <Button onClick={() => window.history.back()}>
              Back to Jobs
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{job.description}</p>
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
            <div className="grid md:grid-cols-3 gap-4">
              {job.salary_range && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Salary Range</h3>
                  <p>{job.salary_range}</p>
                </div>
              )}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Employment Type</h3>
                <p>{job.job_type}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Posted Date</h3>
                <p>{new Date(job.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Application Process</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Interested in this position? Please contact your account manager for more information
              about candidates who match this job description.
            </p>
            <Button>Contact Account Manager</Button>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
