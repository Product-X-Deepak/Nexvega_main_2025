
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
    const { message, userRole, userId, messageHistory = [], model = 'gpt-3.5-turbo' } = await req.json();
    
    if (!message || !userRole) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing required parameters: message and userRole are required" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate model selection
    const supportedModels = ['gpt-3.5-turbo', 'gpt-4o'];
    const selectedModel = supportedModels.includes(model) ? model : 'gpt-3.5-turbo';
    
    // Log the model being used
    console.log(`Using model: ${selectedModel} for user with role: ${userRole}`);
    
    // Determine system prompt based on user role
    const systemPrompt = userRole === 'admin' 
      ? `You are an AI assistant for administrators of an Applicant Tracking System (ATS). 
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
         
         The current date is ${new Date().toISOString().split('T')[0]}.`
      : `You are an AI assistant for staff members of an Applicant Tracking System (ATS).
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
         
         The current date is ${new Date().toISOString().split('T')[0]}.`;
    
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
        max_tokens: 1024
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
