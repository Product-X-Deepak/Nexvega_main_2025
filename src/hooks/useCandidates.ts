
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate, PipelineStage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { convertToCandidates } from '@/utils/typeHelpers';

interface CandidateFilters {
  status: string;
  skills: string[];
  experience: string;
  education: string;
}

export const useCandidates = () => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CandidateFilters>({
    status: '',
    skills: [],
    experience: '',
    education: '',
  });
  
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
      
      setCandidates(convertToCandidates(data || []));
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

  const handleFilterChange = (newFilters: Partial<CandidateFilters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return {
    loading,
    candidates: filteredCandidates,
    searchQuery,
    activeTab,
    showFilters,
    filters,
    fetchCandidates,
    handleSearch,
    handleTabChange,
    toggleFilters,
    handleFilterChange
  };
};
