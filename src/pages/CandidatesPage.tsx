
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  PlusCircle, 
  Upload, 
  Search, 
  UserPlus, 
  Filter, 
  RefreshCw, 
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate, PipelineStage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import CandidateCard from '@/components/candidates/CandidateCard';
import CandidateFilters from '@/components/candidates/CandidateFilters';

export default function CandidatesPage() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    skills: [],
    experience: '',
    education: '',
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchQuery, activeTab, filters]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load candidates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = [...candidates];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.full_name?.toLowerCase().includes(query) ||
        candidate.email?.toLowerCase().includes(query) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(query)) ||
        candidate.resume_summary?.toLowerCase().includes(query)
      );
    }
    
    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'active') {
        filtered = filtered.filter(c => c.status === 'active');
      } else if (activeTab === 'inactive') {
        filtered = filtered.filter(c => c.status === 'inactive');
      } else if (activeTab === 'pipeline') {
        // Group by pipeline stages
        filtered = filtered.filter(c => c.pipeline_stage && c.pipeline_stage !== 'rejected');
      }
    }
    
    // Apply advanced filters
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters.skills.length > 0) {
      filtered = filtered.filter(c => 
        c.skills && filters.skills.every(skill => 
          c.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }
    
    if (filters.experience) {
      // Implement experience filtering based on your data structure
      // This is a placeholder implementation
      filtered = filtered.filter(c => 
        c.experience && c.experience.length > 0
      );
    }
    
    if (filters.education) {
      // Implement education filtering based on your data structure
      filtered = filtered.filter(c => 
        c.education && c.education.length > 0
      );
    }
    
    setFilteredCandidates(filtered);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleAddCandidate = () => {
    navigate('/candidates/new');
  };

  const handleUploadResumes = () => {
    navigate('/candidates/upload');
  };

  const handleRefresh = () => {
    fetchCandidates();
  };

  const handleBulkExport = () => {
    // Implement bulk export functionality
    toast({
      title: "Export Started",
      description: "Preparing candidates data for export...",
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
            <p className="text-muted-foreground">
              Manage and track all candidate profiles
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkExport}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUploadResumes}
              className="flex items-center gap-1"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Resumes</span>
            </Button>
            
            <Button 
              size="sm" 
              onClick={handleAddCandidate}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Candidate</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates by name, email, skills..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFilters}
            className={showFilters ? "border-primary" : ""}
          >
            <Filter className={`h-4 w-4 ${showFilters ? "text-primary" : ""}`} />
          </Button>
        </div>
        
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <CandidateFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Candidates</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="pipeline">In Pipeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="h-64 rounded-lg border border-border bg-card p-4 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div>
                        <div className="h-4 w-32 bg-muted rounded"></div>
                        <div className="h-3 w-24 bg-muted rounded mt-2"></div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-12 bg-muted rounded"></div>
                      <div className="h-6 w-12 bg-muted rounded"></div>
                    </div>
                  </div>
                ))
              ) : filteredCandidates.length > 0 ? (
                filteredCandidates.map((candidate) => (
                  <CandidateCard 
                    key={candidate.id} 
                    candidate={candidate} 
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No candidates found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "Get started by adding candidates or uploading resumes"
                    }
                  </p>
                  <div className="mt-6 flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleUploadResumes}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Resumes
                    </Button>
                    <Button 
                      onClick={handleAddCandidate}
                      className="flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Candidate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
