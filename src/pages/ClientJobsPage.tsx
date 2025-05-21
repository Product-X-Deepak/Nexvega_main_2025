
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClientLayout from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Job } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ClientJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchClientJobs();
  }, []);

  const fetchClientJobs = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform the data to match our Job type
      const transformedJobs = data.map(job => ({
        ...job,
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
        embedding: Array.isArray(job.embedding) ? job.embedding : undefined
      })) as Job[];
      
      setJobs(transformedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            View open positions and job details
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-grid">
            <TabsTrigger value="active">Active Jobs</TabsTrigger>
            <TabsTrigger value="all">All Jobs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={`loading-${i}`} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: 2 }).map((_, j) => (
                          <div key={`badge-${j}`} className="h-6 w-16 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {jobs.filter(job => job.status === 'published').map((job) => (
                  <Card key={job.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{job.job_type}</Badge>
                        <span className="text-sm text-muted-foreground">{job.location || 'Remote'}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm line-clamp-3">{job.description}</p>
                        </div>
                        <div className="flex justify-between pt-2">
                          <Link to={`/client/jobs/${job.id}`}>
                            <Button>View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-lg font-medium mb-2">No Active Jobs</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    There are currently no active job postings available.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-64 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Jobs</CardTitle>
                  <CardDescription>
                    Complete list of all job postings, including closed and upcoming positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {jobs.length > 0 ? (
                    <div className="divide-y">
                      {jobs.map((job) => (
                        <div key={job.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <h3 className="font-medium">{job.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  className={job.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                >
                                  {job.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {job.job_type} • {job.location || 'Remote'}
                                </span>
                              </div>
                            </div>
                            <Link to={`/client/jobs/${job.id}`}>
                              <Button variant="outline" size="sm">View Details</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No jobs found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
