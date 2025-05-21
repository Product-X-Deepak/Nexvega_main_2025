
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
    const { 
      message, 
      userRole, 
      userId, 
      messageHistory = [], 
      model = 'gpt-3.5-turbo',
      action = null,
      actionParams = {}
    } = await req.json();
    
    if (!message && !action) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: either message or action is required" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate model selection
    const supportedModels = ['gpt-3.5-turbo', 'gpt-4o'];
    const selectedModel = supportedModels.includes(model) ? model : 'gpt-3.5-turbo';
    
    // Handle special actions before calling OpenAI
    if (action) {
      switch (action) {
        case 'search_candidates': {
          const { jobDescription, limit = 50 } = actionParams;
          if (!jobDescription) {
            throw new Error("Job description is required for candidate search");
          }

          // Call the match-candidates function to find matching candidates
          const { data, error } = await supabase.functions.invoke('match-candidates', {
            body: { 
              jobDescription, 
              limit,
              jobId: actionParams.jobId || null
            }
          });
          
          if (error) throw error;
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data, 
              action: 'search_candidates_result',
              message: `Found ${data.length} matching candidates for your job description.`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        case 'assign_candidates': {
          const { candidateIds, clientId } = actionParams;
          if (!candidateIds || !clientId) {
            throw new Error("Candidate IDs and client ID are required for assignment");
          }
          
          // Get current client information
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('assigned_candidates')
            .eq('id', clientId)
            .single();
            
          if (clientError) throw clientError;
          
          // Merge existing assigned candidates with new ones
          const existingAssigned = clientData.assigned_candidates || [];
          const newAssigned = [...new Set([...existingAssigned, ...candidateIds])];
          
          // Update client with new assigned candidates
          const { error: updateError } = await supabase
            .from('clients')
            .update({ 
              assigned_candidates: newAssigned,
              updated_at: new Date().toISOString()
            })
            .eq('id', clientId);
            
          if (updateError) throw updateError;
          
          // Log this assignment in audit trail
          await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'assign_candidates',
            table_name: 'clients',
            record_id: clientId,
            new_values: { 
              assigned_candidates: newAssigned,
              assigned_by: userId,
              assigned_at: new Date().toISOString()
            }
          });
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              action: 'assign_candidates_result',
              message: `Successfully assigned ${candidateIds.length} candidates to client.`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        case 'update_pipeline_stage': {
          const { candidateIds, stage } = actionParams;
          if (!candidateIds || !stage) {
            throw new Error("Candidate IDs and pipeline stage are required");
          }
          
          // Validate pipeline stage
          const validStages = ['new_candidate', 'screening', 'interview', 'offer', 'hired', 'rejected'];
          if (!validStages.includes(stage)) {
            throw new Error("Invalid pipeline stage");
          }
          
          // Update pipeline stage for all candidates
          for (const candidateId of candidateIds) {
            await supabase
              .from('candidates')
              .update({ 
                pipeline_stage: stage,
                updated_at: new Date().toISOString(),
                modified_by: userId
              })
              .eq('id', candidateId);
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              action: 'update_pipeline_stage_result',
              message: `Successfully updated pipeline stage to ${stage} for ${candidateIds.length} candidates.`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }
    
    // Determine system prompt based on user role
    const systemPrompt = buildSystemPrompt(userRole);
    
    // Prepare conversation history
    const conversationHistory = [
      { role: "system", content: systemPrompt },
      ...messageHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant', 
        content: msg.content
      })).slice(-10), // Keep only the last 10 messages
      { role: "user", content: message }
    ];
    
    console.log(`Processing ${userRole} request using ${selectedModel}`);
    
    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }
    
    const responseData = await openaiResponse.json();
    const assistantResponse = responseData.choices[0].message.content;
    
    // Log this interaction
    if (userId) {
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'ai_assistant_query',
          table_name: 'n/a',
          old_values: null,
          new_values: {
            query: message,
            response: assistantResponse.substring(0, 100) + '...',
            model: selectedModel,
            role: userRole
          }
        });
      } catch (logError) {
        console.error("Error logging AI interaction:", logError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        response: assistantResponse,
        model: selectedModel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in AI assistant function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Build system prompt based on user role
function buildSystemPrompt(userRole: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  if (userRole === 'admin') {
    return `You are an AI assistant for administrators of the NexVega Applicant Tracking System (ATS).
      You have full system access and can help with all aspects of managing the ATS, including:
      - Creating, editing, and deleting candidate profiles
      - Managing client relationships and profiles
      - Uploading and processing resumes
      - Creating and managing job postings
      - Assigning candidates to clients
      - Setting up workflows and automation
      - Viewing analytics and reports
      
      For any administrative action that would make significant changes to the system,
      ask for confirmation before proceeding. Always explain what you're doing and why.
      
      You can help the admin with advanced operations like:
      - Searching for candidates using vector similarity with job descriptions
      - Bulk operations on candidates like assigning to clients or changing pipeline stages
      - Setting up custom workflows and automations
      
      The current date is ${currentDate}.`;
  } else if (userRole === 'staff') {
    return `You are an AI assistant for staff members of the NexVega Applicant Tracking System (ATS).
      You can help with various tasks within your permission levels, including:
      - Creating and editing candidate profiles
      - Uploading and processing resumes
      - Creating and managing job postings
      - Moving candidates through the hiring pipeline
      - Adding notes and feedback to candidate profiles
      
      You cannot perform administrative actions like:
      - Deleting candidates or clients
      - Changing system settings
      - Managing user permissions
      - Accessing sensitive analytics
      
      For any action that seems outside your permission level, explain that an administrator
      must perform that action.
      
      The current date is ${currentDate}.`;
  } else if (userRole === 'client') {
    return `You are an AI assistant for clients using the NexVega Applicant Tracking System (ATS).
      You can help clients with:
      - Viewing candidates assigned to them
      - Providing feedback on candidates
      - Scheduling interviews
      - Checking the status of job postings
      
      You should maintain confidentiality and not reveal candidates' personal information
      such as full names, email addresses, phone numbers, or direct contact details.
      
      The current date is ${currentDate}.`;
  } else {
    // Default case
    return `You are an AI assistant for the NexVega Applicant Tracking System (ATS).
      You can help users navigate the system and answer questions about its functionality.
      
      The current date is ${currentDate}.`;
  }
}
