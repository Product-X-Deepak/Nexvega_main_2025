
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Initialize the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { candidateId, limit = 10 } = await req.json();
    
    if (!candidateId) {
      return new Response(
        JSON.stringify({ error: "candidateId parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // First get candidate data to understand their profile
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();
      
    if (candidateError) {
      throw new Error(`Failed to fetch candidate: ${candidateError.message}`);
    }

    // Get candidate's interaction history (e.g., jobs they've applied to, liked, etc.)
    // This is a simplified example - in practice, you'd have tables tracking these interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('search_results')
      .select('*')
      .contains('candidate_ids', [candidateId])
      .order('created_at', { ascending: false })
      .limit(5);

    if (interactionsError) {
      console.warn(`Could not fetch interaction history: ${interactionsError.message}`);
    }
      
    // Find jobs similar to the candidate's profile using vector search
    const { data: matchingJobs, error: matchingJobsError } = await supabase
      .rpc('match_jobs_to_candidate', {
        query_embedding: candidateData.embedding,
        match_threshold: 0.6,
        match_count: limit
      });
      
    if (matchingJobsError) {
      throw new Error(`Job matching failed: ${matchingJobsError.message}`);
    }
    
    // Get full details for the matching jobs
    let recommendations = [];
    if (matchingJobs && matchingJobs.length > 0) {
      const jobIds = matchingJobs.map(job => job.id);
      
      const { data: jobDetails, error: jobDetailsError } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds)
        .eq('status', 'published');
        
      if (jobDetailsError) {
        throw new Error(`Failed to fetch job details: ${jobDetailsError.message}`);
      }
      
      // Enhance job details with the similarity score from the match results
      recommendations = jobDetails.map(job => {
        const matchInfo = matchingJobs.find(match => match.id === job.id);
        return {
          ...job,
          similarity_score: matchInfo ? matchInfo.similarity : 0,
          reason: "Based on your skills and experience profile"
        };
      });
      
      // Sort by similarity score
      recommendations.sort((a, b) => b.similarity_score - a.similarity_score);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: recommendations,
        message: `Generated ${recommendations.length} job recommendations for candidate ${candidateId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating job recommendations:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to generate job recommendations" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
