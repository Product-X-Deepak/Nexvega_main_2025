
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Candidate, PipelineStage, CandidateStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { convertToCandidates } from '@/utils/typeHelpers';

interface CandidateFilters {
  status?: CandidateStatus;
  skills?: string[];
  pipelineStage?: PipelineStage;
  minExperience?: number;
  maxExperience?: number;
  location?: string;
}

export function useCandidates() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CandidateFilters>({
    skills: []
  });
  const [searchMode, setSearchMode] = useState<'basic' | 'semantic' | 'boolean'>('basic');
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    
    try {
      let query = supabase.from('candidates').select('*');
      
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
      
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      // Handle search query based on search mode
      if (searchQuery) {
        if (searchMode === 'basic') {
          // Basic search using ILIKE on multiple fields
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        } else if (searchMode === 'boolean') {
          // For boolean search, we would implement a more sophisticated search parser
          // This is simplified for now
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }
        // For semantic search, we would use the vector similarity search in a separate function
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convert database results to Candidate type
      const typedCandidates = convertToCandidates(data);
      
      // Apply client-side filtering for skills
      let filteredCandidates = typedCandidates;
      
      if (filters.skills && filters.skills.length > 0) {
        filteredCandidates = filteredCandidates.filter(candidate => {
          const candidateSkills = candidate.skills || [];
          return filters.skills!.some(skill => 
            candidateSkills.some(candidateSkill => 
              candidateSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
        });
      }
      
      setCandidates(filteredCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, searchQuery, searchMode, toast]);
  
  // Perform semantic search
  const performSemanticSearch = async () => {
    if (!searchQuery.trim() || searchMode !== 'semantic') return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('match-candidates', {
        body: { 
          jobDescription: searchQuery,
          limit: 50
        }
      });
      
      if (error) throw error;
      
      setCandidates(data);
      
      toast({
        title: "Semantic Search Complete",
        description: `Found ${data.length} matching candidates based on your description.`,
      });
    } catch (error) {
      console.error("Error performing semantic search:", error);
      toast({
        title: "Search Error",
        description: "Failed to perform semantic search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch candidates when dependencies change
  useEffect(() => {
    if (searchMode === 'semantic' && searchQuery.trim()) {
      performSemanticSearch();
    } else {
      fetchCandidates();
    }
  }, [fetchCandidates, searchMode, searchQuery]);
  
  // Update pipeline stage for one or more candidates
  const updatePipelineStage = async (candidateIds: string[], stage: PipelineStage) => {
    try {
      for (const id of candidateIds) {
        const { error } = await supabase
          .from('candidates')
          .update({ 
            pipeline_stage: stage,
            updated_at: new Date().toISOString(),
            modified_by: user?.id
          })
          .eq('id', id);
          
        if (error) throw error;
      }
      
      toast({
        title: "Pipeline Updated",
        description: `Successfully moved ${candidateIds.length} candidate(s) to ${stage.replace('_', ' ')} stage.`,
      });
      
      // Refresh candidates
      fetchCandidates();
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update candidate pipeline stage. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Assign candidates to a client
  const assignToClient = async (candidateIds: string[], clientId: string) => {
    try {
      // Get the client's existing assigned candidates
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('assigned_candidates')
        .eq('id', clientId)
        .single();
        
      if (clientError) throw clientError;
      
      // Merge with new candidate IDs (avoid duplicates)
      const existingAssignments = clientData.assigned_candidates || [];
      const updatedAssignments = [...new Set([...existingAssignments, ...candidateIds])];
      
      // Update client
      const { error: updateError } = await supabase
        .from('clients')
        .update({ assigned_candidates: updatedAssignments })
        .eq('id', clientId);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Candidates Assigned",
        description: `Successfully assigned ${candidateIds.length} candidate(s) to client.`,
      });
    } catch (error) {
      console.error("Error assigning candidates:", error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign candidates to client. Please try again.",
        variant: "destructive"
      });
    }
  };
  
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
    assignToClient,
    performSemanticSearch
  };
}
