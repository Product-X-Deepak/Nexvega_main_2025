
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
    const { timeframe = 'month', clientId = null } = await req.json();
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1)); // Default to 1 month
    }
    
    const startDateStr = startDate.toISOString();
    const endDateStr = new Date().toISOString();
    
    // Prepare query filters
    const clientFilter = clientId ? { client_id: clientId } : {};
    
    // Get counts of candidates by status
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .select('status, count(*)')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .group('status');
      
    if (candidatesError) {
      throw new Error(`Failed to fetch candidate analytics: ${candidatesError.message}`);
    }
    
    // Get counts of jobs by status
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('status, count(*)')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .match(clientFilter)
      .group('status');
      
    if (jobsError) {
      throw new Error(`Failed to fetch job analytics: ${jobsError.message}`);
    }
    
    // Get counts of candidates by pipeline stage
    const { data: pipelineData, error: pipelineError } = await supabase
      .from('candidates')
      .select('pipeline_stage, count(*)')
      .not('pipeline_stage', 'is', null)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .group('pipeline_stage');
      
    if (pipelineError) {
      throw new Error(`Failed to fetch pipeline analytics: ${pipelineError.message}`);
    }

    // Get total counts
    const { count: totalCandidates, error: totalCandidatesError } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);
      
    if (totalCandidatesError) {
      throw new Error(`Failed to count candidates: ${totalCandidatesError.message}`);
    }
    
    const { count: totalJobs, error: totalJobsError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .match(clientFilter)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);
      
    if (totalJobsError) {
      throw new Error(`Failed to count jobs: ${totalJobsError.message}`);
    }
    
    // Format the analytics data for the response
    const analyticsData = {
      timeframe,
      period: {
        start: startDateStr,
        end: endDateStr
      },
      totals: {
        candidates: totalCandidates || 0,
        jobs: totalJobs || 0
      },
      candidates_by_status: candidatesData || [],
      jobs_by_status: jobsData || [],
      pipeline_stages: pipelineData || []
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: analyticsData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating analytics:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to generate analytics" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
