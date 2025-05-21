
import React, { useState } from 'react';
import { Search, Filter, BracesAsterisk, SearchCheck, Braces } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CandidatesSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  searchMode?: 'basic' | 'semantic' | 'boolean';
  onSearchModeChange?: (mode: 'basic' | 'semantic' | 'boolean') => void;
}

const CandidatesSearch: React.FC<CandidatesSearchProps> = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  searchMode = 'basic',
  onSearchModeChange = () => {}
}) => {
  const handleSearchModeChange = (value: string) => {
    onSearchModeChange(value as 'basic' | 'semantic' | 'boolean');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              searchMode === 'basic' 
                ? "Search candidates by name, email, skills..." 
                : searchMode === 'semantic' 
                  ? "Describe what you're looking for in natural language..." 
                  : "Use AND, OR, NOT operators (e.g. Java AND (AWS OR Azure))"
            }
            className="pl-9 w-full"
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleFilters}
            className={showFilters ? "border-primary" : ""}
          >
            <Filter className={`h-4 w-4 ${showFilters ? "text-primary" : ""}`} />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <Tabs defaultValue={searchMode} onValueChange={handleSearchModeChange} className="w-full max-w-md">
          <TabsList className="grid grid-cols-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="basic" className="flex items-center gap-1">
                    <Search className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Basic</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Simple keyword matching</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="semantic" className="flex items-center gap-1">
                    <SearchCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Semantic</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI-powered search that understands context</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="boolean" className="flex items-center gap-1">
                    <BracesAsterisk className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Boolean</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Advanced search with AND, OR, NOT operators</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsList>
        </Tabs>
        
        {searchMode === 'boolean' && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Braces className="h-3 w-3 mr-1" />
            View syntax guide
          </Button>
        )}
      </div>
    </div>
  );
};

export default CandidatesSearch;
