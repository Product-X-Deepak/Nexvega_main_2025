
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';
import { PipelineStage } from '@/types';

interface PipelineStageSelectorProps {
  currentStage: PipelineStage | undefined;
  onStageChange: (stage: PipelineStage) => void;
}

// Define stage colors for consistency across the app
export const pipelineStageColors: Record<PipelineStage, string> = {
  'new_candidate': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'screening': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'interview_scheduled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'interview_completed': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'technical_assessment': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  'reference_check': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  'offer_pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'offer_sent': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  'offer_accepted': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300',
  'offer_rejected': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  'onboarding': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  'hired': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Define the logical flow of the pipeline stages
const pipelineStages: { value: PipelineStage; label: string }[] = [
  { value: 'new_candidate', label: 'New Candidate' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_completed', label: 'Interview Completed' },
  { value: 'technical_assessment', label: 'Technical Assessment' },
  { value: 'reference_check', label: 'Reference Check' },
  { value: 'offer_pending', label: 'Offer Pending' },
  { value: 'offer_sent', label: 'Offer Sent' },
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'offer_rejected', label: 'Offer Rejected' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const PipelineStageSelector: React.FC<PipelineStageSelectorProps> = ({ 
  currentStage = 'new_candidate', 
  onStageChange 
}) => {
  // Format stage for display
  const formatStageLabel = (stage: string): string => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between"
        >
          <span className={`h-2 w-2 rounded-full mr-2 ${pipelineStageColors[currentStage]?.split(' ')[0]}`} />
          <span className="flex-1 text-left">
            {formatStageLabel(currentStage)}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={currentStage} onValueChange={(value: string) => onStageChange(value as PipelineStage)}>
          {pipelineStages.map((stage) => (
            <DropdownMenuRadioItem 
              key={stage.value} 
              value={stage.value}
              className="flex items-center"
            >
              <span className={`h-2 w-2 rounded-full mr-2 ${pipelineStageColors[stage.value]?.split(' ')[0]}`} />
              {stage.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PipelineStageSelector;
