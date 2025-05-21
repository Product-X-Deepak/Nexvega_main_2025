
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Job } from "@/lib/supabase";

interface JobRecommendationsProps {
  candidateId: string;
  limit?: number;
}

export function JobRecommendations({ candidateId, limit = 5 }: JobRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-job-recommendations', {
        body: { candidateId, limit }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        setRecommendations(data.data);
      } else {
        throw new Error("Failed to load recommendations");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Error",
        description: "Could not load job recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchRecommendations();
    }
  }, [candidateId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Job Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-4"></div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  ))}
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3"></div>
                {i < 2 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Job Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No job recommendations available yet.
            </p>
            <Button size="sm" onClick={fetchRecommendations}>
              Generate Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Job Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((job, i) => (
            <div key={job.id}>
              <div className="mb-3">
                <h3 className="font-medium text-base">{job.title}</h3>
                <div className="text-sm text-muted-foreground">{job.job_type}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.requirements?.slice(0, 4).map((req: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                  {job.requirements?.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{job.requirements.length - 4}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={job.similarity_score >= 80 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                    {job.similarity_score}% Match
                  </Badge>
                  <span className="text-xs text-muted-foreground">{job.reason}</span>
                </div>
              </div>
              {i < recommendations.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={fetchRecommendations}>
            Refresh Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
