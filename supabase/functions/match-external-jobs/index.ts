
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

// Cosine similarity function
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { candidateId, externalJobData } = await req.json();
    
    if (!candidateId || !externalJobData) {
      return new Response(
        JSON.stringify({ 
          error: "candidateId and externalJobData parameters are required" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the candidate's data
    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();
      
    if (candidateError) {
      throw new Error(`Failed to fetch candidate: ${candidateError.message}`);
    }
    
    // Generate embedding for the external job data
    const jobText = `
      ${externalJobData.title || ''}
      ${externalJobData.description || ''}
      ${externalJobData.requirements?.join(' ') || ''}
      ${externalJobData.responsibilities?.join(' ') || ''}
    `;
    
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: jobText,
    });

    const jobEmbedding = embeddingResponse.data[0].embedding;
    
    // Use OpenAI to analyze the match between the candidate and the job
    const matchAnalysis = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert recruiting assistant that evaluates how well a candidate matches a job description. Provide a detailed analysis of the match, highlighting strengths and potential gaps."
        },
        {
          role: "user",
          content: `Analyze how well this candidate matches the following job:\n\nCandidate:\n${JSON.stringify(candidateData)}\n\nJob:\n${JSON.stringify(externalJobData)}`
        }
      ]
    });

    const analysisResult = matchAnalysis.choices[0].message.content;

    // Calculate similarity score using the candidate's embedding
    let similarityScore = null;
    if (candidateData.embedding && jobEmbedding) {
      similarityScore = calculateCosineSimilarity(candidateData.embedding, jobEmbedding);
      // Scale to 0-100 range for better readability
      similarityScore = Math.round(similarityScore * 100);
    }

    // Generate skill match breakdown
    const candidateSkills = candidateData.skills || [];
    const jobRequirements = externalJobData.requirements || [];
    
    const matchedSkills = candidateSkills.filter(skill => 
      jobRequirements.some(req => 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    const missingSkills = jobRequirements.filter(req => 
      !candidateSkills.some(skill => 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          match_analysis: analysisResult,
          similarity_score: similarityScore,
          matched_skills: matchedSkills,
          missing_skills: missingSkills,
          external_job: externalJobData,
          candidate: {
            id: candidateData.id,
            full_name: candidateData.full_name,
            skills: candidateData.skills,
            experience: candidateData.experience
          }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error matching external job:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to match external job" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
