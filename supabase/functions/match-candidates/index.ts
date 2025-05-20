
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { jobId, limit = 20, saveResults = true } = await req.json();
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "jobId parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // First get the job's embedding
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('embedding')
      .eq('id', jobId)
      .single();
      
    if (jobError) {
      throw new Error(`Failed to fetch job: ${jobError.message}`);
    }
    
    if (!jobData.embedding) {
      throw new Error('Job has no embedding. Generate an embedding first.');
    }
    
    // Use vector similarity search to find matching candidates
    const { data: candidates, error: candidatesError } = await supabase
      .rpc('match_candidates_to_job', {
        query_embedding: jobData.embedding,
        match_threshold: 0.5,
        match_count: limit
      });
      
    if (candidatesError) {
      throw new Error(`Candidate matching failed: ${candidatesError.message}`);
    }

    // Save the match results if requested
    if (saveResults && candidates.length > 0) {
      const candidateIds = candidates.map((c: any) => c.id);
      const scores = candidates.map((c: any) => c.similarity);
      
      const { error: saveError } = await supabase
        .from('search_results')
        .insert({
          job_id: jobId,
          candidate_ids: candidateIds,
          scores: scores,
          created_by: req.headers.get('x-user-id') || null
        });
        
      if (saveError) {
        console.error('Error saving search results:', saveError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: candidates,
        message: `Found ${candidates.length} matching candidates for job ${jobId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error matching candidates:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to match candidates" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
