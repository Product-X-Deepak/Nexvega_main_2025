
import { CircularProgress } from "@/components/ui/progress";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface MatchScoreProps {
  score: number;
  matchAnalysis?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  isLoading?: boolean;
  className?: string;
}

export function MatchScore({ 
  score, 
  matchAnalysis, 
  matchedSkills = [], 
  missingSkills = [],
  isLoading = false,
  className = ""
}: MatchScoreProps) {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 bg-green-50 dark:bg-green-950";
    if (score >= 60) return "text-amber-500 bg-amber-50 dark:bg-amber-950";
    return "text-red-500 bg-red-50 dark:bg-red-950";
  };

  // Determine text label based on score
  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Good Match";
    if (score >= 50) return "Fair Match";
    return "Poor Match";
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex justify-between items-center">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-16 w-16 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
          </CardTitle>
          <CardDescription className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mt-2"></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex justify-between items-center">
          <div className="flex flex-col">
            <span>Match Score</span>
            <Badge className={`mt-1 ${scoreColor} w-fit`}>
              {scoreLabel}
            </Badge>
          </div>
          <div className="relative inline-flex items-center justify-center">
            <CircularProgress
              value={score}
              className="h-16 w-16"
              indicatorColor={score >= 70 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}
              trackColor="bg-gray-200 dark:bg-gray-800"
            />
            <span className="absolute text-sm font-medium">{score}%</span>
          </div>
        </CardTitle>
        <CardDescription>
          Similarity score based on skills, experience and job requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        {matchAnalysis && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Match Analysis:</h4>
            <p className="text-sm text-muted-foreground">{matchAnalysis}</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-4">
          {matchedSkills.length > 0 && (
            <div className="w-full">
              <h4 className="text-sm font-medium mb-1">Matched Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map((skill, index) => (
                  <Badge key={`matched-${index}`} variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {missingSkills.length > 0 && (
            <div className="w-full mt-2">
              <h4 className="text-sm font-medium mb-1">Missing Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((skill, index) => (
                  <Badge key={`missing-${index}`} variant="outline" className="text-red-500">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <CardFooter className="pt-0 pb-3">
          <span className="text-xs text-muted-foreground">
            {matchedSkills.length} skills matched, {missingSkills.length} skills missing
          </span>
        </CardFooter>
      )}
    </Card>
  );
}
