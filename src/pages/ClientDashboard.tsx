
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/components/layout/ClientLayout';
import { supabase } from '@/lib/supabase';
import { 
  UserIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assignedCandidates: 0,
    activejobs: 0,
    likedCandidates: 0,
    rejectedCandidates: 0
  });
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        // In a real implementation, these would be actual Supabase queries
        // For demo purposes, we'll use mock data
        
        // Simulate loading data from Supabase
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user?.id)
          .single();
          
        // For demo, we'll set placeholder values
        setStats({
          assignedCandidates: 32,
          activejobs: 5,
          likedCandidates: 12,
          rejectedCandidates: 8
        });
        
        // Sample recent candidates
        setRecentCandidates([
          {
            id: 1,
            skills: ['React', 'TypeScript', 'Node.js'],
            summary: 'Experienced frontend developer with 5 years of experience building responsive web applications.',
            education: 'MSc Computer Science',
            experience: '5 years',
            status: 'assigned',
            pipeline_stage: 'screening'
          },
          {
            id: 2,
            skills: ['Python', 'Django', 'PostgreSQL'],
            summary: 'Backend developer specializing in building scalable APIs and database architecture.',
            education: 'BSc Software Engineering',
            experience: '3 years',
            status: 'assigned',
            pipeline_stage: 'interview'
          },
          {
            id: 3,
            skills: ['AWS', 'Terraform', 'Docker', 'Kubernetes'],
            summary: 'DevOps engineer with experience in CI/CD pipelines and cloud infrastructure.',
            education: 'BSc Computer Engineering',
            experience: '4 years',
            status: 'assigned',
            pipeline_stage: 'screening'
          },
          {
            id: 4,
            skills: ['UI/UX', 'Figma', 'Adobe XD'],
            summary: 'Product designer with a focus on creating intuitive user experiences and interfaces.',
            education: 'BFA Design',
            experience: '6 years',
            status: 'assigned',
            pipeline_stage: 'review'
          }
        ]);
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user?.id]);

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
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Here's your candidate pipeline</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Assigned Candidates"
            value={stats.assignedCandidates}
            icon={UserIcon}
            bgColor="bg-blue-600"
            onClick={() => navigate('/client/candidates')}
          />
          <StatCard
            title="Active Jobs"
            value={stats.activejobs}
            icon={BriefcaseIcon}
            bgColor="bg-indigo-600"
            onClick={() => navigate('/client/jobs')}
          />
          <StatCard
            title="Liked Candidates"
            value={stats.likedCandidates}
            icon={CheckCircleIcon}
            bgColor="bg-green-600"
            onClick={() => navigate('/client/candidates?filter=liked')}
          />
          <StatCard
            title="Rejected Candidates"
            value={stats.rejectedCandidates}
            icon={XCircleIcon}
            bgColor="bg-red-600"
            onClick={() => navigate('/client/candidates?filter=rejected')}
          />
        </div>

        {/* Recent Candidates */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Recent Candidates</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Review candidates that have been assigned to you
              </p>
            </div>
            <button
              onClick={() => navigate('/client/candidates')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              View All Candidates
            </button>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <li key={i} className="px-6 py-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                recentCandidates.map((candidate: any) => (
                  <li 
                    key={candidate.id} 
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => navigate(`/client/candidates/${candidate.id}`)}
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Candidate #{candidate.id}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100">
                          {candidate.pipeline_stage}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {candidate.summary}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{candidate.education}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{candidate.experience} experience</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {candidate.skills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between pt-2">
                        <div className="flex space-x-2">
                          <button 
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle like action
                            }}
                          >
                            Like
                          </button>
                          <button 
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle reject action
                            }}
                          >
                            Reject
                          </button>
                        </div>
                        <button 
                          className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle contact action
                          }}
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
