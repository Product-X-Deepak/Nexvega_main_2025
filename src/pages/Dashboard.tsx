
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Briefcase, 
  Building, 
  Clock, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend 
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeCandidates: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalClients: 0,
    activeClients: 0,
    recentActivity: []
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch candidate stats
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('id, status', { count: 'exact' });
        
      if (candidatesError) throw candidatesError;
      
      const totalCandidates = candidatesData?.length || 0;
      const activeCandidates = candidatesData?.filter(c => c.status === 'active').length || 0;
      
      // Fetch job stats
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, status', { count: 'exact' });
        
      if (jobsError) throw jobsError;
      
      const totalJobs = jobsData?.length || 0;
      const activeJobs = jobsData?.filter(j => j.status === 'published').length || 0;
      
      // Fetch client stats
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, status', { count: 'exact' });
        
      if (clientsError) throw clientsError;
      
      const totalClients = clientsData?.length || 0;
      const activeClients = clientsData?.filter(c => c.status === 'active').length || 0;
      
      // Fetch recent activity (mocked for now)
      const recentActivity = [
        { 
          id: 1, 
          type: 'candidate', 
          action: 'New candidate added', 
          timestamp: '2023-05-20T10:30:00Z',
          description: 'John Doe was added to the system'
        },
        { 
          id: 2, 
          type: 'job', 
          action: 'Job posted', 
          timestamp: '2023-05-19T14:45:00Z',
          description: 'Senior React Developer position published'
        },
        { 
          id: 3, 
          type: 'client', 
          action: 'Client updated', 
          timestamp: '2023-05-18T09:15:00Z',
          description: 'ABC Corp details were updated'
        },
        { 
          id: 4, 
          type: 'candidate', 
          action: 'Interview scheduled', 
          timestamp: '2023-05-17T16:20:00Z',
          description: 'Interview scheduled for Jane Smith'
        },
      ];
      
      setStats({
        totalCandidates,
        activeCandidates,
        totalJobs,
        activeJobs,
        totalClients,
        activeClients,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Chart data for candidates by status
  const candidateStatusData = [
    { name: 'Active', value: stats.activeCandidates },
    { name: 'Inactive', value: stats.totalCandidates - stats.activeCandidates }
  ];
  
  // Chart data for jobs by status
  const jobStatusData = [
    { name: 'Published', value: stats.activeJobs },
    { name: 'Draft/Archived', value: stats.totalJobs - stats.activeJobs }
  ];
  
  // Chart colors
  const COLORS = ['#4ade80', '#f87171', '#fb923c', '#60a5fa', '#c084fc'];
  
  // Mock data for pipeline stages chart
  const pipelineData = [
    { name: 'New', count: 24 },
    { name: 'Screening', count: 18 },
    { name: 'Interview', count: 12 },
    { name: 'Offer', count: 6 },
    { name: 'Hired', count: 3 },
  ];
  
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email || 'User'}! Here's an overview of your recruitment activities.
          </p>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCandidates} active candidates
              </p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/candidates')}
              >
                <span>View all candidates</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalJobs} total job postings
              </p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/jobs')}
              >
                <span>Manage jobs</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeClients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalClients} total clients
              </p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/clients')}
              >
                <span>View clients</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Next interview in 2 days
              </p>
            </CardContent>
            <CardFooter className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/interviews')}
              >
                <span>View schedule</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Charts and additional data */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Candidate pipeline chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Candidate Pipeline</CardTitle>
              <CardDescription>
                Distribution of candidates across pipeline stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pipelineData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Candidates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Status distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
              <CardDescription>
                Candidate and job status distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="h-36">
                  <h4 className="text-sm font-medium mb-2">Candidates</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={candidateStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {candidateStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-36">
                  <h4 className="text-sm font-medium mb-2">Jobs</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={jobStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {jobStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent activity and tasks */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {activity.type === 'candidate' && <Users className="h-4 w-4" />}
                      {activity.type === 'job' && <Briefcase className="h-4 w-4" />}
                      {activity.type === 'client' && <Building className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center pt-1">
                        <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Tasks/Reminders */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Your upcoming tasks and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Review candidate applications</p>
                      <p className="text-xs text-muted-foreground">5 pending applications</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
                
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Schedule interview</p>
                      <p className="text-xs text-muted-foreground">For John Doe - Frontend Developer</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Schedule
                  </Button>
                </div>
                
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Respond to candidate rejection</p>
                      <p className="text-xs text-muted-foreground">Client rejected 3 candidates</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Respond
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Complete onboarding</p>
                      <p className="text-xs text-muted-foreground">For Sarah Williams - UX Designer</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/tasks')}>
                <Inbox className="mr-2 h-4 w-4" />
                View all tasks
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
