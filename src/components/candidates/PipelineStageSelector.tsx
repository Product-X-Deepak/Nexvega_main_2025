
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PipelineStage } from '@/types';
import { validatePipelineStage } from '@/utils/typeHelpers';

interface PipelineStageSelectorProps {
  currentStage: PipelineStage | undefined;
  onStageChange: (stage: PipelineStage) => void;
  disabled?: boolean;
}

const stages: { value: PipelineStage; label: string; }[] = [
  { value: 'new_candidate', label: 'New Candidate' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const PipelineStageSelector: React.FC<PipelineStageSelectorProps> = ({
  currentStage,
  onStageChange,
  disabled = false,
}) => {
  // Use a safe default if currentStage is undefined
  const safeCurrentStage = currentStage ? validatePipelineStage(currentStage) : 'new_candidate';
  
  return (
    <Select
      value={safeCurrentStage}
      onValueChange={(value) => onStageChange(validatePipelineStage(value))}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select stage" />
      </SelectTrigger>
      <SelectContent>
        {stages.map((stage) => (
          <SelectItem key={stage.value} value={stage.value}>
            {stage.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PipelineStageSelector;
