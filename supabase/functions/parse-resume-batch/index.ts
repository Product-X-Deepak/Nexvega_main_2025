
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

// Get environment variables
const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for cross-origin requests
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
    const { fileCount, userId } = await req.json();
    
    if (!fileCount || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: fileCount and userId are required" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create a storage bucket for resumes if it doesn't exist
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();
        
      if (bucketError) throw bucketError;
      
      const resumeBucket = buckets.find(bucket => bucket.name === 'resumes');
      
      if (!resumeBucket) {
        // Create the bucket
        const { error: createError } = await supabase
          .storage
          .createBucket('resumes', {
            public: true,
            allowedMimeTypes: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/csv',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'text/plain'
            ],
            fileSizeLimit: 5242880 // 5MB
          });
          
        if (createError) throw createError;
        
        console.log('Created resumes storage bucket');
      }
    } catch (error) {
      console.error('Error checking/creating storage bucket:', error);
      // Continue even if there's an error, as the bucket might already exist
    }
    
    // Return success - actual processing will happen client-side
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Ready to process ${fileCount} resumes for user ${userId}`,
        uploadPath: `${userId}/${Date.now()}_`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in parse-resume-batch function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An unknown error occurred"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
