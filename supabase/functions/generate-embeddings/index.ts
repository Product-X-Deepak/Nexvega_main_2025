
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import OpenAI from "https://esm.sh/openai@4.26.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Initialize OpenAI with the API key from environment variables
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

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
    const { recordId, recordType, text } = await req.json();
    
    if (!recordId || !recordType || !text) {
      return new Response(
        JSON.stringify({ 
          error: "recordId, recordType, and text parameters are required" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Update the record with the embedding
    let updateResult;
    if (recordType === 'candidate') {
      updateResult = await supabase
        .from('candidates')
        .update({ embedding })
        .eq('id', recordId);
    } else if (recordType === 'job') {
      updateResult = await supabase
        .from('jobs')
        .update({ embedding })
        .eq('id', recordId);
    } else {
      throw new Error(`Unsupported record type: ${recordType}`);
    }

    if (updateResult.error) {
      throw updateResult.error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Embedding generated and saved for ${recordType} ${recordId}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating embedding:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to generate embedding" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
