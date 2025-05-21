
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { CandidateStatus } from '@/types';

interface CandidateFiltersProps {
  filters: {
    status: string;
    skills: string[];
    experience: string;
    education: string;
  };
  onFilterChange: (filters: any) => void;
}

const CandidateFilters: React.FC<CandidateFiltersProps> = ({ filters, onFilterChange }) => {
  const [skillInput, setSkillInput] = useState('');
  
  const statuses: CandidateStatus[] = ['active', 'inactive', 'blocked', 'unavailable'];
  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6-10 years)' },
    { value: 'expert', label: 'Expert Level (10+ years)' },
  ];
  
  const educationLevels = [
    { value: 'high_school', label: 'High School' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelors', label: 'Bachelor\'s Degree' },
    { value: 'masters', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD or Doctorate' },
  ];
  
  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value });
  };
  
  const handleExperienceChange = (value: string) => {
    onFilterChange({ experience: value });
  };
  
  const handleEducationChange = (value: string) => {
    onFilterChange({ education: value });
  };
  
  const handleAddSkill = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      onFilterChange({ skills: [...filters.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };
  
  const handleRemoveSkill = (skill: string) => {
    onFilterChange({ skills: filters.skills.filter(s => s !== skill) });
  };
  
  const handleSkillKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };
  
  const handleClearFilters = () => {
    onFilterChange({
      status: '',
      skills: [],
      experience: '',
      education: '',
    });
    setSkillInput('');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearFilters}
        >
          Clear All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Status</label>
          <Select 
            value={filters.status} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Experience Level Filter */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Experience</label>
          <Select 
            value={filters.experience} 
            onValueChange={handleExperienceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Experience</SelectItem>
              {experienceLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Education Level Filter */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Education</label>
          <Select 
            value={filters.education} 
            onValueChange={handleEducationChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any Education" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Education</SelectItem>
              {educationLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Skills Filter */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Skills</label>
          <div className="flex">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyPress}
              placeholder="Add skill..."
              className="flex-1"
            />
            <Button 
              type="button" 
              size="sm" 
              variant="ghost"
              className="ml-1 px-2" 
              onClick={handleAddSkill}
              disabled={!skillInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Selected Skills Display */}
      {filters.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.skills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
              {skill}
              <button 
                type="button" 
                onClick={() => handleRemoveSkill(skill)} 
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateFilters;
