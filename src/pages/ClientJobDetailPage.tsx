
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        .eq('status', 'published') // Only fetch published jobs for clients
        .single();
        
      if (error) throw error;
      
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details or job not available',
        variant: 'destructive',
      });
      navigate('/client/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const handleContact = () => {
    toast({
      title: 'Contact Request Sent',
      description: 'A recruiter will contact you about this job soon.',
    });
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

  if (!job) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold">Job Not Found</h2>
          <p className="mt-2 text-muted-foreground">The job you are looking for does not exist or has been removed.</p>
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {job.title}
              </h1>
              <Badge className={getStatusColor(job.status)}>
                {job.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {job.location || 'Remote/Various'} • {job.job_type}
            </p>
          </div>
          
          <Button onClick={handleContact}>
            Contact Recruiter
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.description}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Job Type</h3>
                <p>{job.job_type}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Location</h3>
                <p>{job.location || 'Remote/Various'}</p>
              </div>
              {job.salary_range && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Salary Range</h3>
                  <p>{job.salary_range}</p>
                </div>
              )}
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Posted Date</h3>
                <p>{new Date(job.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-2 gap-5">
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
            <CardTitle>Application Process</CardTitle>
            <CardDescription>
              How to apply for this position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              To apply for this position, please contact your recruiter or click the "Contact Recruiter" 
              button above. Your recruiter will guide you through the next steps in the application process.
            </p>
            <Button onClick={handleContact}>
              Contact Recruiter About This Position
            </Button>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
