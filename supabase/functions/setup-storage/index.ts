
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Create the 'resumes' bucket if it doesn't exist
    const { data: resumeBucket, error: resumeError } = await supabase
      .storage
      .getBucket('resumes');
      
    if (!resumeBucket) {
      const { data, error } = await supabase
        .storage
        .createBucket('resumes', {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          allowedMimeTypes: [
            'application/pdf', 
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
          ]
        });
        
      if (error) throw error;
      console.log("Created 'resumes' bucket", data);
    }
    
    // Create the 'profile-images' bucket if it doesn't exist
    const { data: profileBucket, error: profileError } = await supabase
      .storage
      .getBucket('profile-images');
      
    if (!profileBucket) {
      const { data, error } = await supabase
        .storage
        .createBucket('profile-images', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
          allowedMimeTypes: [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/webp'
          ]
        });
        
      if (error) throw error;
      console.log("Created 'profile-images' bucket", data);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Storage buckets configured successfully"
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
    
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
