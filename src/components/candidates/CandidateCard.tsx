
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Candidate } from '@/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Bookmark, 
  Calendar, 
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface CandidateCardProps {
  candidate: Candidate;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const navigate = useNavigate();
  
  const viewProfile = () => {
    navigate(`/candidates/${candidate.id}`);
  };
  
  // Function to get formatted date
  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Get icon for pipeline stage
  const getPipelineStageIcon = () => {
    switch (candidate.pipeline_stage) {
      case 'new_candidate':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'screening':
        return <Bookmark className="h-4 w-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'offer':
        return <Briefcase className="h-4 w-4 text-orange-500" />;
      case 'hired':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get color for pipeline stage badge
  const getPipelineStageColor = () => {
    switch (candidate.pipeline_stage) {
      case 'new_candidate':
        return 'bg-gray-100 text-gray-800';
      case 'screening':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-indigo-100 text-indigo-800';
      case 'offer':
        return 'bg-orange-100 text-orange-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format pipeline stage for display
  const formatPipelineStage = (stage?: string) => {
    if (!stage) return 'Unknown';
    return stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {candidate.full_name || 'Unnamed Candidate'}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={`${getPipelineStageColor()} flex items-center gap-1`}>
                  {getPipelineStageIcon()}
                  <span className="hidden sm:inline">{formatPipelineStage(candidate.pipeline_stage)}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pipeline Stage: {formatPipelineStage(candidate.pipeline_stage)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          {candidate.experience && candidate.experience.length > 0 
            ? `${(candidate.experience[0] as any).title || 'Professional'} at ${(candidate.experience[0] as any).company || 'Company'}` 
            : 'No current position'}
        </p>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        <div className="space-y-2">
          {candidate.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{candidate.email}</span>
            </div>
          )}
          
          {candidate.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{candidate.phone}</span>
            </div>
          )}
          
          <div className="mt-3">
            {candidate.skills && candidate.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {candidate.skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{candidate.skills.length - 3}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills listed</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          Added {getFormattedDate(candidate.created_at)}
        </div>
        <Button variant="ghost" size="sm" onClick={viewProfile} className="gap-1">
          View Profile
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CandidateCard;
