
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
    const { candidateId, limit = 20 } = await req.json();
    
    if (!candidateId) {
      return new Response(
        JSON.stringify({ error: "candidateId parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // First get the candidate's embedding
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('embedding')
      .eq('id', candidateId)
      .single();
      
    if (candidateError) {
      throw new Error(`Failed to fetch candidate: ${candidateError.message}`);
    }
    
    if (!candidateData.embedding) {
      throw new Error('Candidate has no embedding. Generate an embedding first.');
    }
    
    // Use vector similarity search to find matching jobs
    const { data: jobs, error: jobsError } = await supabase
      .rpc('match_jobs_to_candidate', {
        query_embedding: candidateData.embedding,
        match_threshold: 0.5,
        match_count: limit
      });
      
    if (jobsError) {
      throw new Error(`Job matching failed: ${jobsError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: jobs,
        message: `Found ${jobs.length} matching jobs for candidate ${candidateId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error matching jobs:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to match jobs" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
