
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Ensure we have necessary API keys
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }
    
    // Get request body
    const { jobDescription, limit = 50, jobId = null } = await req.json();
    
    if (!jobDescription) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameter: jobDescription is required" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Generate embedding for job description
    console.log("Generating embedding for job description");
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: jobDescription.substring(0, 8000)  // Limit to 8000 chars
      })
    });
    
    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }
    
    const embeddingData = await embeddingResponse.json();
    const jobEmbedding = embeddingData.data[0].embedding;
    
    // Store job embedding if jobId is provided
    if (jobId) {
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ embedding: jobEmbedding })
        .eq('id', jobId);
        
      if (updateError) {
        console.error(`Error updating job with embedding: ${updateError.message}`);
      } else {
        console.log(`Successfully updated job ${jobId} with embedding`);
      }
    }
    
    // Search for similar candidate vectors
    const { data: matchedCandidates, error: searchError } = await supabase.rpc(
      'match_candidates_by_vector',
      {
        query_embedding: jobEmbedding,
        match_threshold: 0.5,
        match_count: limit
      }
    );
    
    if (searchError) {
      throw new Error(`Error searching candidates: ${searchError.message}`);
    }
    
    // Store search results if jobId is provided
    if (jobId && matchedCandidates.length > 0) {
      const candidateIds = matchedCandidates.map(c => c.id);
      const scores = matchedCandidates.map(c => c.similarity);
      
      const { error: resultError } = await supabase
        .from("search_results")
        .insert({
          job_id: jobId,
          candidate_ids: candidateIds,
          scores: scores,
          created_at: new Date().toISOString(),
          created_by: req.headers.get("x-supabase-auth-user-id") || null
        });
        
      if (resultError) {
        console.error(`Error storing search results: ${resultError.message}`);
      } else {
        console.log(`Successfully stored search results for job ${jobId}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: matchedCandidates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in match-candidates function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
