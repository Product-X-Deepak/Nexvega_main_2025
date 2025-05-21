
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

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
    // Ensure we have an OpenAI API key
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "OpenAI API key not configured. Please set the OPENAI_API_KEY in the edge function secrets." 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get request body
    const { resumeText } = await req.json();
    
    if (!resumeText || resumeText.trim().length < 10) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Resume text is too short or empty" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Set up system prompt for resume parsing
    const systemPrompt = `
      You are an expert ATS (Applicant Tracking System) resume parser.
      Extract the following information in a structured JSON format:
      - full_name: The candidate's full name
      - email: The candidate's email address
      - phone: The candidate's phone number
      - linkedin_url: The candidate's LinkedIn profile URL if available
      - other_links: Array of other relevant URLs (GitHub, portfolio, etc.)
      - social_media: Object with social media handles (key is platform, value is handle/URL)
      - resume_summary: A concise summary of the candidate's profile
      - objective: The candidate's career objective if stated
      - skills: Array of technical and soft skills
      - languages: Array of languages known
      - education: Array of education details with institution, degree, field_of_study, start_date, end_date, grade
      - experience: Array of work experiences with company, title, location, start_date, end_date, current (boolean), responsibilities (array)
      - projects: Array of projects with name, description, technologies, url, start_date, end_date
      - publications: Array of publications with title, publisher, date, url, description

      Return only the JSON object without any explanations.
      Leave fields empty or null if the information is not available in the resume.
    `;
    
    // Send request to OpenAI API
    console.log("Sending resume text to OpenAI for parsing...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: resumeText }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", result);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${result.error?.message || "Unknown error"}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const parsedContent = result.choices[0].message.content;
    let parsedData;
    
    try {
      parsedData = JSON.parse(parsedContent);
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Failed to parse OpenAI response" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log("Successfully parsed resume");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: parsedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error("Error in parse-resume function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An unexpected error occurred" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
