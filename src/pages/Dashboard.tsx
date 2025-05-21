
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  UserIcon,
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin, isStaff } = useAuth();
  const [stats, setStats] = useState({
    candidates: 0,
    clients: 0,
    jobs: 0,
    resumes: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Sample pipeline data
  const pipelineData = [
    { name: 'Applied', count: 32 },
    { name: 'Screening', count: 24 },
    { name: 'Interview', count: 18 },
    { name: 'Offered', count: 8 },
    { name: 'Hired', count: 5 },
    { name: 'Rejected', count: 14 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // In a real implementation, these would be actual Supabase queries
        // For demo purposes, we'll use mock data
        
        // Simulate loading data from Supabase
        const { data: candidatesCount } = await supabase
          .from('candidates')
          .select('id', { count: 'exact', head: true });
          
        const { data: clientsCount } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true });
          
        const { data: jobsCount } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true });
          
        // Count candidates with resume files instead of querying non-existent "resumes" table
        const { data: resumesCount } = await supabase
          .from('candidates')
          .select('id', { count: 'exact', head: true })
          .not('resume_url', 'is', null);
        
        // For demo, we'll set placeholder values
        setStats({
          candidates: candidatesCount?.length || 128,
          clients: clientsCount?.length || 23,
          jobs: jobsCount?.length || 47,
          resumes: resumesCount?.length || 145
        });
        
        // Sample recent activities
        setRecentActivities([
          {
            id: 1,
            type: 'candidate',
            action: 'added',
            name: 'Julia Robinson',
            timestamp: '2 hours ago',
            user: 'Sarah Wilson'
          },
          {
            id: 2,
            type: 'job',
            action: 'updated',
            name: 'Senior Frontend Developer',
            timestamp: '3 hours ago',
            user: 'Michael Scott'
          },
          {
            id: 3,
            type: 'client',
            action: 'added',
            name: 'TechCorp Solutions',
            timestamp: '5 hours ago',
            user: 'David Chen'
          },
          {
            id: 4,
            type: 'candidate',
            action: 'assigned',
            name: 'Robert Johnson',
            timestamp: '1 day ago',
            user: 'Emily Davis'
          },
          {
            id: 5,
            type: 'job',
            action: 'closed',
            name: 'UX Designer',
            timestamp: '2 days ago',
            user: 'Sarah Wilson'
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, bgColor, onClick }) => (
    <div 
      className={`overflow-hidden rounded-lg ${bgColor} shadow hover:shadow-lg transition-shadow cursor-pointer`}
      onClick={onClick}
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-white/10 rounded-md p-3">
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-white truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-white">
                {loading ? (
                  <div className="animate-pulse h-8 w-16 bg-white/20 rounded"></div>
                ) : (
                  value
                )}
              </div>
            </dd>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Here's what's happening today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Candidates"
            value={stats.candidates}
            icon={UserIcon}
            bgColor="bg-blue-600"
            onClick={() => navigate('/candidates')}
          />
          <StatCard
            title="Clients"
            value={stats.clients}
            icon={UserGroupIcon}
            bgColor="bg-indigo-600"
            onClick={() => navigate('/clients')}
          />
          <StatCard
            title="Open Jobs"
            value={stats.jobs}
            icon={BriefcaseIcon}
            bgColor="bg-purple-600"
            onClick={() => navigate('/jobs')}
          />
          <StatCard
            title="Resumes Processed"
            value={stats.resumes}
            icon={DocumentTextIcon}
            bgColor="bg-pink-600"
            onClick={() => navigate('/candidates')}
          />
        </div>

        {/* Two column layout for charts and activity */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Pipeline Chart */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Candidate Pipeline</h3>
            </div>
            <div className="px-4 sm:px-6 py-3 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipelineData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <li key={i} className="px-6 py-4">
                      <div className="animate-pulse flex space-x-4">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  recentActivities.map((activity: any) => (
                    <li key={activity.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {activity.type === 'candidate' && <UserIcon className="h-6 w-6 text-blue-500" />}
                          {activity.type === 'job' && <BriefcaseIcon className="h-6 w-6 text-purple-500" />}
                          {activity.type === 'client' && <UserGroupIcon className="h-6 w-6 text-indigo-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {activity.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {activity.action} by {activity.user}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                          {activity.timestamp}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Admin Only Section */}
        {isAdmin() && (
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Admin Tools</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Quick access to administrative functions
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div 
                  className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/users')}
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <UserIcon className="h-6 w-6 text-indigo-500" />
                      <span className="ml-3 text-base font-medium text-gray-900 dark:text-white">Manage Users</span>
                    </div>
                  </div>
                </div>
                <div 
                  className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/settings')}
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <UserIcon className="h-6 w-6 text-purple-500" />
                      <span className="ml-3 text-base font-medium text-gray-900 dark:text-white">System Settings</span>
                    </div>
                  </div>
                </div>
                <div 
                  className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/analytics')}
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <UserIcon className="h-6 w-6 text-blue-500" />
                      <span className="ml-3 text-base font-medium text-gray-900 dark:text-white">Analytics Dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
