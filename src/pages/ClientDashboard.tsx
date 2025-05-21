import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Candidate, Client } from '@/types';
import { convertToCandidates } from '@/utils/typeHelpers';
import { Loader2, UserCheck, Building, Briefcase, Clock } from 'lucide-react';

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [activeJobs, setActiveJobs] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        if (!user?.id) return;

        // Fetch client profile
        const { data: clientProfile, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (clientError) throw clientError;
        setClientData(clientProfile);

        // Fetch assigned candidates
        if (clientProfile?.assigned_candidates?.length) {
          const { data: assignedCandidates, error: candidatesError } = await supabase
            .from('candidates')
            .select('*')
            .in('id', clientProfile.assigned_candidates)
            .order('updated_at', { ascending: false });

          if (candidatesError) throw candidatesError;
          setCandidates(convertToCandidates(assignedCandidates || []));
          setRecentCandidates(convertToCandidates(assignedCandidates?.slice(0, 5) || []));
        }

        // Fetch active jobs count
        const { count, error: jobsError } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('status', 'published');

        if (jobsError) throw jobsError;
        setActiveJobs(count || 0);
      } catch (error) {
        console.error('Error fetching client dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user, toast]);

  if (loading) {
    return (
      <MainLayout allowedRoles={['client']}>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout allowedRoles={['client']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.email}</h1>
          <p className="text-gray-500 dark:text-gray-400">Here's your candidate pipeline</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Candidates</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{candidates.length}</div>
              <p className="text-xs text-muted-foreground">
                {candidates.length === 1 ? 'Candidate' : 'Candidates'} assigned to you
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs}</div>
              <p className="text-xs text-muted-foreground">
                {activeJobs === 1 ? 'Job' : 'Jobs'} currently active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Company</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{clientData?.company_name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                {clientData?.industry || 'Industry not specified'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Update</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clientData?.updated_at 
                  ? new Date(clientData.updated_at).toLocaleDateString() 
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Last profile update
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="candidates">
          <TabsList>
            <TabsTrigger value="candidates">Recent Candidates</TabsTrigger>
            <TabsTrigger value="jobs">Your Jobs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="candidates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recently Assigned Candidates</CardTitle>
                <CardDescription>
                  Review and provide feedback on candidates assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentCandidates.length > 0 ? (
                  <div className="space-y-4">
                    {recentCandidates.map((candidate) => (
                      <div key={candidate.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <h3 className="font-medium">{candidate.full_name || 'Unnamed Candidate'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {candidate.skills?.slice(0, 3).join(', ')}
                            {candidate.skills && candidate.skills.length > 3 ? '...' : ''}
                          </p>
                        </div>
                        <Button asChild size="sm">
                          <Link to={`/client/candidates/${candidate.id}`}>View Profile</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No candidates have been assigned to you yet.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/client/candidates">View All Candidates</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Active Jobs</CardTitle>
                <CardDescription>
                  Jobs you've posted that are currently active
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeJobs > 0 ? (
                  <div className="text-center py-6">
                    <p>You have {activeJobs} active {activeJobs === 1 ? 'job' : 'jobs'}.</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">You don't have any active jobs.</p>
                    <p className="text-muted-foreground mt-1">Contact your account manager to post a new job.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/client/jobs">View All Jobs</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
