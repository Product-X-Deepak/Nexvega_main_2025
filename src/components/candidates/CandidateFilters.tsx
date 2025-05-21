
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CandidateFiltersProps {
  filters: {
    status?: string;
    skills?: string[];
    pipelineStage?: string;
    minExperience?: number;
    maxExperience?: number;
    location?: string;
  };
  onFilterChange: (key: string, value: any) => void;
}

const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const [skillInput, setSkillInput] = React.useState('');
  
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const currentSkills = filters.skills || [];
      if (!currentSkills.includes(skillInput.trim())) {
        onFilterChange('skills', [...currentSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };
  
  const handleRemoveSkill = (skill: string) => {
    const currentSkills = filters.skills || [];
    onFilterChange('skills', currentSkills.filter(s => s !== skill));
  };
  
  const handleExperienceChange = (value: number[]) => {
    onFilterChange('minExperience', value[0]);
    onFilterChange('maxExperience', value[1]);
  };
  
  const handleClearFilters = () => {
    onFilterChange('status', undefined);
    onFilterChange('skills', []);
    onFilterChange('pipelineStage', undefined);
    onFilterChange('minExperience', undefined);
    onFilterChange('maxExperience', undefined);
    onFilterChange('location', undefined);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearFilters}
        >
          Clear all
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => onFilterChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pipeline-stage">Pipeline Stage</Label>
          <Select 
            value={filters.pipelineStage} 
            onValueChange={(value) => onFilterChange('pipelineStage', value)}
          >
            <SelectTrigger id="pipeline-stage">
              <SelectValue placeholder="Any Stage" />
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
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Any location"
            value={filters.location || ''}
            onChange={(e) => onFilterChange('location', e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="skills">Skills</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(filters.skills || []).map((skill) => (
            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
              {skill}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleRemoveSkill(skill)} 
              />
            </Badge>
          ))}
        </div>
        <Input
          id="skills"
          placeholder="Add a skill and press Enter"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={handleAddSkill}
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <Label htmlFor="experience">Years of Experience</Label>
          <span className="text-sm text-muted-foreground">
            {filters.minExperience || 0} - {filters.maxExperience || 20}+ years
          </span>
        </div>
        <Slider
          id="experience"
          defaultValue={[filters.minExperience || 0, filters.maxExperience || 20]}
          min={0}
          max={20}
          step={1}
          onValueChange={handleExperienceChange}
        />
      </div>
    </div>
  );
};

export default CandidateFilters;
