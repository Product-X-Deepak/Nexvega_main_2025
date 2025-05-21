
import React, { useState } from 'react';
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Candidate } from '@/types';

export default function CandidatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isStaff } = useAuth();
  
  // State for bulk actions
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string>('');
  const [clientOptions, setClientOptions] = useState<{ id: string, name: string }[]>([]);
  
  const {
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
  } = useCandidates();

  const handleAddCandidate = () => {
    navigate('/candidates/new');
  };

  const handleUploadResumes = () => {
    navigate('/candidates/upload');
  };

  const handleRefresh = () => {
    fetchCandidates();
    toast({
      title: "Refreshed",
      description: "Candidate list has been refreshed",
    });
  };

  const handleBulkExport = () => {
    // Implement bulk export functionality
    const selectedData = selectedCandidates.length > 0 
      ? candidates.filter(c => selectedCandidates.includes(c.id)) 
      : candidates;
    
    toast({
      title: "Export Started",
      description: `Preparing ${selectedData.length} candidates for export...`,
    });
    
    // Mock export completion
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `${selectedData.length} candidates exported successfully`,
      });
    }, 1500);
  };
  
  const handleSelectCandidate = (candidateId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCandidates(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidates(prev => prev.filter(id => id !== candidateId));
    }
    
    // Show bulk actions when at least one candidate is selected
    setShowBulkActions(selectedCandidates.length > 0);
  };
  
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedCandidates(candidates.map(c => c.id));
    } else {
      setSelectedCandidates([]);
    }
    
    setShowBulkActions(isSelected && candidates.length > 0);
  };
  
  const handleSearchModeChange = (mode: 'basic' | 'semantic' | 'boolean') => {
    setSearchMode(mode);
  };
  
  const handleOpenAssignDialog = async () => {
    try {
      // Fetch clients for dropdown
      const { data, error } = await supabase.from('clients')
        .select('id, company_name')
        .eq('status', 'active')
        .order('company_name');
      
      if (error) throw error;
      
      setClientOptions(data.map(client => ({
        id: client.id,
        name: client.company_name
      })));
      
      setShowAssignDialog(true);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to load client data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleConfirmAssign = async () => {
    if (!selectedClientId) {
      toast({
        title: "No Client Selected",
        description: "Please select a client to assign candidates to.",
        variant: "destructive"
      });
      return;
    }
    
    await assignToClient(selectedCandidates, selectedClientId);
    setShowAssignDialog(false);
    setSelectedClientId('');
  };
  
  const handleOpenPipelineDialog = () => {
    setShowPipelineDialog(true);
  };
  
  const handleConfirmPipelineChange = async () => {
    if (!selectedPipelineStage) {
      toast({
        title: "No Stage Selected",
        description: "Please select a pipeline stage.",
        variant: "destructive"
      });
      return;
    }
    
    await updatePipelineStage(selectedCandidates, selectedPipelineStage as PipelineStage);
    setShowPipelineDialog(false);
    setSelectedPipelineStage('');
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
          searchMode={searchMode}
          onSearchModeChange={handleSearchModeChange}
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
        
        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedCandidates.length === candidates.length}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                {selectedCandidates.length} candidate{selectedCandidates.length !== 1 && 's'} selected
              </label>
            </div>
            <div className="flex gap-2">
              {(isAdmin() || isStaff()) && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleOpenAssignDialog}
                  >
                    Assign to Client
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleOpenPipelineDialog}
                  >
                    Update Pipeline Stage
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkExport}
              >
                Export Selected
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedCandidates([]);
                  setShowBulkActions(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
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
              selectedCandidates={selectedCandidates}
              onSelectCandidate={handleSelectCandidate}
              onSelectAll={handleSelectAll}
              showSelection={showBulkActions}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Assign to Client Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Candidates to Client</DialogTitle>
            <DialogDescription>
              Select a client to assign the {selectedCandidates.length} selected candidate{selectedCandidates.length !== 1 && 's'} to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="client-select" className="text-sm font-medium">
                Select Client
              </label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="client-select">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAssignDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmAssign}>
              Assign Candidates
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Update Pipeline Stage Dialog */}
      <Dialog open={showPipelineDialog} onOpenChange={setShowPipelineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Pipeline Stage</DialogTitle>
            <DialogDescription>
              Select a new pipeline stage for the {selectedCandidates.length} selected candidate{selectedCandidates.length !== 1 && 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="stage-select" className="text-sm font-medium">
                Select Stage
              </label>
              <Select value={selectedPipelineStage} onValueChange={setSelectedPipelineStage}>
                <SelectTrigger id="stage-select">
                  <SelectValue placeholder="Select a pipeline stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_candidate">New Candidate</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPipelineDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmPipelineChange}>
              Update Stage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// Import Supabase client
import { supabase } from '@/integrations/supabase/client';
// Import PipelineStage type
import { PipelineStage } from '@/types';
