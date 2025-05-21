
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Candidate, PipelineStage, CandidateStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { convertToCandidates } from '@/utils/typeHelpers';

interface CandidateFilters {
  status?: CandidateStatus;
  skills?: string[];
  pipelineStage?: PipelineStage;
  minExperience?: number;
  maxExperience?: number;
  location?: string;
  education?: string;
}

export function useCandidates() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [searchMode, setSearchMode] = useState<'basic' | 'semantic' | 'boolean'>('basic');
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch candidates function
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('candidates')
        .select('*')
        .order('updated_at', { ascending: false });
      
      // Apply search if provided
      if (searchQuery) {
        if (searchMode === 'basic') {
          // Basic text search (fallback)
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,skills.cs.{${searchQuery}}`);
        } else if (searchMode === 'boolean') {
          // For boolean search, we'd ideally process the query string into a structured query
          // This is a simplified version for demo
          const terms = searchQuery.split(' AND ');
          terms.forEach(term => {
            if (term.includes('NOT ')) {
              const notTerm = term.replace('NOT ', '');
              query = query.not('full_name', 'ilike', `%${notTerm}%`);
            } else if (term.includes(' OR ')) {
              const orTerms = term.split(' OR ');
              const orConditions = orTerms.map(t => `full_name.ilike.%${t}%`).join(',');
              query = query.or(orConditions);
            } else {
              query = query.ilike('full_name', `%${term}%`);
            }
          });
        }
        // For semantic search, we'll handle it separately with embeddings
      }
      
      // Apply filters based on active tab
      if (activeTab === 'active') {
        query = query.eq('status', 'active' as CandidateStatus);
      } else if (activeTab === 'inactive') {
        query = query.eq('status', 'inactive' as CandidateStatus);
      } else if (activeTab === 'pipeline') {
        query = query.not('pipeline_stage', 'eq', 'new_candidate' as PipelineStage);
      }
      
      // Apply additional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.pipelineStage) {
        query = query.eq('pipeline_stage', filters.pipelineStage);
      }
      
      if (filters.skills && filters.skills.length > 0) {
        // Use overlap operator to find candidates with any of these skills
        query = query.contains('skills', filters.skills);
      }
      
      if (filters.location) {
        // Search for location in experience array
        query = query.textSearch('experience', filters.location);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const typedCandidates = convertToCandidates(data);
        setCandidates(typedCandidates);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast({
        title: 'Error fetching candidates',
        description: error.message || 'Failed to load candidates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab, filters, searchMode, toast]);

  // Semantic search using embeddings
  const performSemanticSearch = async (query: string) => {
    try {
      setLoading(true);
      
      // Call the match-candidates function with the search query
      const { data, error } = await supabase.functions.invoke('match-candidates', {
        body: { 
          jobDescription: query,
          limit: 50
        }
      });
      
      if (error) throw error;
      
      if (data) {
        setCandidates(convertToCandidates(data));
      }
    } catch (error) {
      console.error('Error performing semantic search:', error);
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to perform semantic search',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

  const handleFilterChange = (newFilters: Partial<CandidateFilters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const updatePipelineStage = async (candidateIds: string[], stage: PipelineStage) => {
    try {
      // Call edge function to update pipeline stage
      const { error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'update_pipeline_stage',
          actionParams: {
            candidateIds,
            stage
          },
          userId: user?.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Updated ${candidateIds.length} candidates to ${stage} stage`,
      });
      
      // Refresh candidate list
      fetchCandidates();
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update pipeline stage',
        variant: 'destructive',
      });
    }
  };

  const assignToClient = async (candidateIds: string[], clientId: string) => {
    try {
      // Call edge function to assign candidates to client
      const { error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'assign_candidates',
          actionParams: {
            candidateIds,
            clientId
          },
          userId: user?.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Assigned ${candidateIds.length} candidates to client`,
      });
      
      // Refresh candidate list
      fetchCandidates();
    } catch (error) {
      console.error('Error assigning candidates:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign candidates to client',
        variant: 'destructive',
      });
    }
  };

  // Effect hook to fetch candidates
  useEffect(() => {
    if (searchMode === 'semantic' && searchQuery.length > 0) {
      // Use semantic search when that mode is selected and there's a query
      performSemanticSearch(searchQuery);
    } else {
      fetchCandidates();
    }
  }, [fetchCandidates, searchMode, searchQuery]);

  return {
    loading,
    candidates,
    searchQuery,
    activeTab,
    showFilters,
    filters,
    searchMode,
    fetchCandidates,
    handleSearch,
    handleTabChange,
    toggleFilters,
    handleFilterChange,
    setSearchMode,
    updatePipelineStage,
    assignToClient
  };
}
