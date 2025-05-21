
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
    const { recordId, recordType, text } = await req.json();
    
    if (!recordId || !recordType || !text) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: recordId, recordType, and text are required" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate record type
    if (!["candidate", "job"].includes(recordType)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid recordType. Must be either 'candidate' or 'job'" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Generate embedding via OpenAI API
    console.log(`Generating embedding for ${recordType} (${recordId})`);
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000)  // Limit to 8000 chars to stay within API limits
      })
    });
    
    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }
    
    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;
    
    // Update the record with the embedding
    const tableName = recordType === "candidate" ? "candidates" : "jobs";
    
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ embedding })
      .eq('id', recordId);
      
    if (updateError) {
      throw new Error(`Error updating ${recordType} with embedding: ${updateError.message}`);
    }
    
    console.log(`Successfully updated ${recordType} ${recordId} with embedding`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully generated and stored embedding for ${recordType} ${recordId}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in generate-embeddings function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
