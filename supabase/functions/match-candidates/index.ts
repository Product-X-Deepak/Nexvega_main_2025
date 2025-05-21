
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
          error: "Job description is required for candidate matching" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing job description for candidate matching: ${jobDescription.substring(0, 50)}...`);
    
    // Generate embedding for job description
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: jobDescription.substring(0, 8000) // Limit to 8000 chars
      })
    });
    
    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }
    
    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Store the job if jobId is provided
    if (jobId) {
      // Update job with embedding
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ embedding })
        .eq('id', jobId);
        
      if (updateError) {
        console.error(`Error updating job with embedding: ${updateError.message}`);
        // Continue with search anyway
      }
    }
    
    // Search for candidates using vector similarity
    console.log("Searching for candidates with vector similarity...");
    
    // This SQL query uses the cosine_distance function to find similar candidates
    const { data: candidates, error: searchError } = await supabase.rpc(
      'match_candidates_by_embedding',
      {
        query_embedding: embedding,
        match_threshold: 0.5, // Adjust threshold as needed (0.0-1.0)
        match_count: limit
      }
    );
    
    if (searchError) {
      // If the RPC function doesn't exist, fall back to regular search
      console.error("Error with vector search:", searchError);
      
      // Fallback to regular search
      console.log("Falling back to regular search...");
      const { data: fallbackCandidates, error: fallbackError } = await supabase
        .from('candidates')
        .select('*')
        .eq('status', 'active')
        .limit(limit);
        
      if (fallbackError) throw fallbackError;
      
      // Save search results
      if (jobId) {
        try {
          await supabase.from('search_results').insert({
            job_id: jobId,
            candidate_ids: fallbackCandidates.map(c => c.id),
            scores: fallbackCandidates.map(() => 0), // No scores in fallback
            created_by: null
          });
        } catch (saveError) {
          console.error("Error saving search results:", saveError);
          // Continue anyway
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: fallbackCandidates,
          message: "Found using fallback search (no vector matching)"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Extract and format candidate data
    console.log(`Found ${candidates.length} matching candidates`);
    
    // Save search results if jobId is provided
    if (jobId && candidates.length > 0) {
      try {
        await supabase.from('search_results').insert({
          job_id: jobId,
          candidate_ids: candidates.map(c => c.id),
          scores: candidates.map(c => c.similarity),
          created_by: null
        });
      } catch (saveError) {
        console.error("Error saving search results:", saveError);
        // Continue anyway
      }
    }
    
    // Return matched candidates
    return new Response(
      JSON.stringify({ 
        success: true,
        data: candidates,
        message: `Found ${candidates.length} matching candidates using vector similarity`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in match-candidates function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An unknown error occurred"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
