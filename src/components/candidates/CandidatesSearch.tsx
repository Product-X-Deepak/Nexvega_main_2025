
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CandidatesSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

const CandidatesSearch: React.FC<CandidatesSearchProps> = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search candidates by name, email, skills..."
          className="pl-9 w-full"
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleFilters}
        className={showFilters ? "border-primary" : ""}
      >
        <Filter className={`h-4 w-4 ${showFilters ? "text-primary" : ""}`} />
      </Button>
    </div>
  );
};

export default CandidatesSearch;
