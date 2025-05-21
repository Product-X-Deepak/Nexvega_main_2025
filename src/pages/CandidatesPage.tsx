
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import CandidateFilters from '@/components/candidates/CandidateFilters';
import CandidatesHeader from '@/components/candidates/CandidatesHeader';
import CandidatesSearch from '@/components/candidates/CandidatesSearch';
import CandidatesList from '@/components/candidates/CandidatesList';
import { useCandidates } from '@/hooks/useCandidates';

export default function CandidatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    loading,
    candidates,
    searchQuery,
    activeTab,
    showFilters,
    filters,
    fetchCandidates,
    handleSearch,
    handleTabChange,
    toggleFilters,
    handleFilterChange
  } = useCandidates();

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
        <CandidatesHeader 
          onRefresh={handleRefresh}
          onBulkExport={handleBulkExport}
          onUploadResumes={handleUploadResumes}
          onAddCandidate={handleAddCandidate}
        />
        
        <CandidatesSearch 
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          showFilters={showFilters}
          onToggleFilters={toggleFilters}
        />
        
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
            <CandidatesList 
              loading={loading}
              candidates={candidates}
              onAddCandidate={handleAddCandidate}
              onUploadResumes={handleUploadResumes}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
