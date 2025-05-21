import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Candidate, PipelineStage } from '@/types';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Badge, 
  Avatar, 
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Clock,
  Calendar,
  Star,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CandidateCardProps {
  candidate: Candidate;
}

const pipelineStageColors: Record<PipelineStage, string> = {
  'new_candidate': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'screening': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'interview': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'offer': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'hired': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusColors: Record<string, string> = {
  'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'blocked': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'unavailable': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
};

const getInitials = (name: string | undefined): string => {
  if (!name) return 'CN';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const navigate = useNavigate();
  const timeAgo = candidate.created_at ? 
    formatDistanceToNow(new Date(candidate.created_at), { addSuffix: true }) : 'Recently';

  // Function to generate a background color based on name
  const getAvatarColor = (name: string | undefined): string => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-red-500', 'bg-teal-500', 'bg-orange-500'
    ];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const handleCardClick = () => {
    navigate(`/candidates/${candidate.id}`);
  };

  const topSkills = candidate.skills?.slice(0, 3) || [];
  const latestExperience = candidate.experience && candidate.experience.length > 0 
    ? candidate.experience[0] 
    : null;

  const hasClientInteractions = 
    (candidate.assigned_to_clients && candidate.assigned_to_clients.length > 0) || 
    (candidate.liked_by_clients && candidate.liked_by_clients.length > 0);

  return (
    <Card 
      className="hover:border-primary transition-colors cursor-pointer overflow-hidden group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className={`${getAvatarColor(candidate.full_name)}`}>
              <AvatarFallback>{getInitials(candidate.full_name)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                {candidate.full_name || 'Unnamed Candidate'}
              </h3>
              
              <div className="flex flex-wrap gap-2 mt-1">
                {candidate.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[candidate.status] || 'bg-gray-100'}`}>
                    {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                  </span>
                )}
                
                {candidate.pipeline_stage && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pipelineStageColors[candidate.pipeline_stage]}`}>
                    {candidate.pipeline_stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 pt-1">
        <div className="space-y-2">
          {/* Contact Info */}
          <div className="flex flex-col gap-1">
            {candidate.email && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{candidate.email}</span>
              </div>
            )}
            
            {candidate.phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span>{candidate.phone}</span>
              </div>
            )}
          </div>
          
          {/* Experience */}
          {latestExperience && (
            <div className="flex items-start text-sm">
              <Briefcase className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <span className="font-medium">{latestExperience.title}</span>
                {latestExperience.company && (
                  <span className="text-muted-foreground"> at {latestExperience.company}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Skills */}
          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {topSkills.map((skill, index) => (
                <Badge key={index} variant="outline" className="bg-secondary/50">
                  {skill}
                </Badge>
              ))}
              {(candidate.skills?.length || 0) > 3 && (
                <Badge variant="outline" className="bg-secondary/30">
                  +{(candidate.skills?.length || 0) - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasClientInteractions && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span>{(candidate.liked_by_clients?.length || 0) + (candidate.assigned_to_clients?.length || 0)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {candidate.assigned_to_clients && candidate.assigned_to_clients.length > 0 && 
                        `Assigned to ${candidate.assigned_to_clients.length} client(s)`}
                      {candidate.assigned_to_clients && candidate.assigned_to_clients.length > 0 && 
                       candidate.liked_by_clients && candidate.liked_by_clients.length > 0 && ', '}
                      {candidate.liked_by_clients && candidate.liked_by_clients.length > 0 && 
                        `Liked by ${candidate.liked_by_clients.length} client(s)`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {candidate.resume_url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resume available</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CandidateCard;
