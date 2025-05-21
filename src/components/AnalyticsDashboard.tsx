
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

export enum AnalyticsTimeframe {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

interface AnalyticsDashboardProps {
  clientId?: string;
}

interface AnalyticsData {
  timeframe: string;
  period: {
    start: string;
    end: string;
  };
  totals: {
    candidates: number;
    jobs: number;
  };
  candidates_by_status: Array<{
    status: string;
    count: number;
  }>;
  jobs_by_status: Array<{
    status: string;
    count: number;
  }>;
  pipeline_stages: Array<{
    pipeline_stage: string;
    count: number;
  }>;
}

// Colors for charts
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
  '#d0ed57', '#ffc658', '#ff8042', '#ff6361', '#bc5090'
];

export default function AnalyticsDashboard({ clientId }: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>(AnalyticsTimeframe.MONTH);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalyticsData = async (selectedTimeframe: AnalyticsTimeframe) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-analytics', {
        body: { 
          timeframe: selectedTimeframe,
          clientId: clientId || null 
        }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        setAnalyticsData(data.data);
      } else {
        throw new Error("Failed to load analytics data");
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Could not load analytics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData(timeframe);
  }, [timeframe, clientId]);

  // Format dates for display
  const formatDateRange = () => {
    if (!analyticsData?.period) return "";
    
    const startDate = new Date(analyticsData.period.start);
    const endDate = new Date(analyticsData.period.end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  // Format pipeline stage names
  const formatPipelineStage = (stage: string): string => {
    return stage
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-1/4 rounded"></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-medium mb-2 md:mb-0">
          {clientId ? 'Client Analytics' : 'ATS Analytics'}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {formatDateRange()}
          </span>
        </h2>
        
        <Tabs
          defaultValue={timeframe}
          onValueChange={(value) => setTimeframe(value as AnalyticsTimeframe)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Candidate Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData?.pipeline_stages && analyticsData.pipeline_stages.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.pipeline_stages.map(item => ({
                  name: formatPipelineStage(item.pipeline_stage),
                  value: item.count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60">
                <p className="text-muted-foreground">No pipeline data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData?.jobs_by_status && analyticsData.jobs_by_status.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.jobs_by_status.map(item => ({
                      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                      value: item.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.jobs_by_status.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-60">
                <p className="text-muted-foreground">No jobs data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="py-5">
            <CardTitle className="text-2xl font-bold text-center">
              {analyticsData?.totals?.candidates || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center">
            <p className="text-sm text-muted-foreground">Total Candidates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-5">
            <CardTitle className="text-2xl font-bold text-center">
              {analyticsData?.totals?.jobs || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center">
            <p className="text-sm text-muted-foreground">Total Jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-5">
            <CardTitle className="text-2xl font-bold text-center">
              {analyticsData?.pipeline_stages?.find(s => s.pipeline_stage === 'hired')?.count || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-center">
            <p className="text-sm text-muted-foreground">Hired Candidates</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
