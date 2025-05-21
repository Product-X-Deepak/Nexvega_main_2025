
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Create vector similarity search function
    const { error: fnError } = await supabase.rpc('create_vector_match_function');
    
    if (fnError) {
      throw new Error(`Error creating vector match function: ${fnError.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Vector search functions created successfully"
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error setting up vector search:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
